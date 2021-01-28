import { Gateway, GatewayOptions } from 'fabric-network';
import * as _ from 'lodash';
import { DatabaseSyncAdapter } from './adapters';
import { SCHEMA } from './constants';
import { Channel, ChannelOption } from './types';
import { abort, getLogger } from './utilities';

const logger = getLogger('Sync');

type ChannelCache = {
	[name: string]: {
		channel: Channel;
		writePending: boolean;
	};
};

type SyncOptions = {
	gatewayOptions: GatewayOptions;
	networkConfig: string | object;
	database: DatabaseSyncAdapter;
	channels: ChannelOption[];
	options: {
		writeInterval: number;
	};
};

export class ExplorerSync {
	private networkConfig: string | object;
	private gatewayOptions: GatewayOptions;
	private gateway = new Gateway();
	private channels: ChannelOption[];
	private listeners = [];

	private database: DatabaseSyncAdapter;
	private writing = false;
	private writeCache: ChannelCache = {};
	private writeInterval: number;
	private timer: NodeJS.Timeout = null;

	constructor({
		networkConfig,
		gatewayOptions,
		database,
		channels,
		options: { writeInterval } }: SyncOptions) {

		this.networkConfig = networkConfig;
		this.gatewayOptions = gatewayOptions;
		this.database = database;
		this.channels = channels;
		this.writeInterval = writeInterval;
	}

	public async start() {
		await this.gateway
			.connect(this.networkConfig, this.gatewayOptions)
			.catch(error => abort(`[Explorer.Sync] Unable to connect to gateway`, error));

		await this.database
			.setup(SCHEMA, this.channels.map(c => c.name))
			.catch(error => abort(`[Explorer.Sync] Unable to run setup on database`, error));

		this.timer = setInterval(() => this.flushPendingWrites(), this.writeInterval);

		this.listeners = [];
		for (let { name, options: { startBlock = 'auto' } } of this.channels) {
			if (startBlock === 'auto') {
				const channelHeight = await this.getChannelHeight(name);
				startBlock = channelHeight || 0;
			}
			await this.addBlockListener(name, startBlock).catch(error =>
				abort(`[Explorer.Sync] Unable to add block listener: name=${name}, startBlock=${startBlock}`, error),
			);
		}
	}

	public stop() {
		if (this.timer) {
			clearTimeout(this.timer);
		}
		logger.info(`Cleaning up listeners`);
		for (const listener of this.listeners) {
			listener.unregister();
		}
	}

	private async addBlockListener(channelName: string, startBlock) {
		const channel = await this.gateway
			.getNetwork(channelName)
			.catch(error => abort(`[Explorer.Sync] Unable to get channel: ${channelName}`, error));

		this.listeners.push(
			await channel.addBlockListener(
				'listener',
				(error, event) => this.onEvent(error, event, channelName),
				{ startBlock }));
		logger.debug(`[${channelName}/${startBlock}] Added Block Listener`);
	}

	private async onEvent(error, event, channelName) {
		if (error) {
			logger.error(`annelName}] Block Event Error: ${error.message}`);
			return;
		}

		try {
			await this.onBlock(event, channelName);
		} catch (exception) {
			logger.error(`${channelName}] Unhandled Block Error`, exception);
		}
	}

	private async onBlock(event: any, channelName: string) {
		const hash = event.header.data_hash;
		const height = parseInt(event.header.number, 10);
		const transactions = _.get(event, 'data.data', []);
		const timestamp = transactions[0].payload.header.channel_header.timestamp;
		const previousHash = event.header.previous_hash;

		const channelHeight = await this.getChannelHeight(channelName);
		if (height > channelHeight) {
			for (const transactionData of transactions) {
				await this.onTransaction(transactionData, { hash, height });
			}
			await this.database.addBlock({
				id: hash,
				height,
				timestamp: new Date(timestamp),
				previousHash,
				transactions: transactions.length,
				channelName,
			});
			this.updateChannel({ name: channelName, height, lastHash: hash });
		}
	}

	private async onTransaction(transactionData: any, block: { hash: string, height: number }) {
		const channelHeader = _.get(transactionData, 'payload.header.channel_header');
		const chaincodeResponse = _.get(transactionData, 'payload.data.actions[0].payload.action.proposal_response_payload.extension');

		const chaincodeWrites = {};
		const chaincodeReads = {};
		if (chaincodeResponse) {
			for (const item of chaincodeResponse.results.ns_rwset) {
				for (const read of item.rwset.reads) {
					chaincodeReads[read.key] = read.version
						? {
							block: parseInt(read.version.block_num, 10),
							transaction: parseInt(read.version.tx_num, 10),
						}
						: null;
				}
				for (const write of item.rwset.writes) {
					chaincodeWrites[write.key] = write.isDelete ? null : this.tryJsonParse(write.value);
				}
			}
		}

		await this.database.addTransaction({
			blockHash: block.hash,
			blockHeight: block.height,
			id: channelHeader.tx_id,
			type: channelHeader.type,
			typeString: channelHeader.typeString,
			timestamp: new Date(channelHeader.timestamp),
			channelName: channelHeader.channel_id,
			channelVersion: channelHeader.version,
			chaincodeName: chaincodeResponse ? chaincodeResponse.chaincode_id.name : null,
			chaincodeVersion: chaincodeResponse ? chaincodeResponse.chaincode_id.version : null,
			chaincodeResponseStatus: chaincodeResponse ? chaincodeResponse.response.status : null,
			chaincodeResponse: chaincodeResponse ? this.tryJsonParse(chaincodeResponse.response.payload) : null,
			chaincodeWrites: chaincodeResponse ? chaincodeWrites : null,
			chaincodeReads: chaincodeResponse ? chaincodeReads : null,
		});
	}

	private tryJsonParse(value) {
		try {
			return JSON.parse(value);
		} catch (error) {
			return value;
		}
	}

	private async getChannelHeight(name: string): Promise<number> {
		if (!this.writeCache[name]) {
			const channel = await this.database.getChannel(name);
			this.writeCache[name] = { channel, writePending: false };
			logger.info(`Loaded channel height from database: ${channel.height}`);
		}
		return this.writeCache[name].channel.height;
	}

	private updateChannel(channel: Channel): void {
		this.writeCache[channel.name] = { channel, writePending: true };
	}

	private async flushPendingWrites() {
		if (this.writing) {
			return;
		}

		this.writing = true;
		for (const item of Object.values(this.writeCache)) {
			if (item.writePending) {
				await this.database.updateChannel(item.channel);
				item.writePending = false;
			}
		}
		this.writing = false;
	}
}
