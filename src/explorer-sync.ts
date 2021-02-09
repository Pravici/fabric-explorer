import { Gateway, GatewayOptions } from 'fabric-network';
import * as _ from 'lodash';
import { DatabaseAdapter } from './adapters';
import { Channel, ChannelOption } from './types';
import { abort, getLogger } from './utilities';

type ChannelCache = {
	[name: string]: {
		channel: Channel;
		writePending: boolean;
	};
};

type SyncOptions = {
	gatewayOptions: GatewayOptions;
	networkConfig: string | object;
	database: DatabaseAdapter;
	channels: ChannelOption[];
	options: {
		writeInterval: number;
	};
};

export class ExplorerSync {
	private logger = getLogger('Sync');

	private networkConfig: string | object;
	private gatewayOptions: GatewayOptions;
	private gateway = new Gateway();
	private channels: ChannelOption[];
	private listeners = [];

	private database: DatabaseAdapter;
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
			.connect()
			.catch(error => abort(`[Explorer.Sync] Database connection problem`, error));

		await this.database
			.setup(this.channels.map(c => c.name))
			.catch(error => abort(`[Explorer.Sync] Unable to run setup on database`, error));

		this.logger.debug(`Write interval set to ${this.writeInterval}`);
		this.timer = setInterval(() => this.flushPendingWrites(), this.writeInterval);

		// popular channel cache
		for (const { name } of this.channels) {
			await this.getChannelHeight(name);
		}

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
		if (this.database) {
			this.database.disconnect();
		}
		this.logger.info(`Cleaning up listeners`);
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
		this.logger.debug(`[${channelName}/${startBlock}] Added Block Listener`);
	}

	private async onEvent(error, event, channelName) {
		if (error) {
			this.logger.error(`annelName}] Block Event Error: ${error.message}`);
			return;
		}

		try {
			await this.onBlock(event, channelName);
		} catch (exception) {
			this.logger.error(`${channelName}] Unhandled Block Error`, exception);
		}
	}

	private async onBlock(event: any, channelName: string) {
		const hash = event.header.data_hash;
		const shortId = hash.substr(0, 16);
		const height = parseInt(event.header.number, 10);
		const transactions = _.get(event, 'data.data', []);
		const timestamp = transactions[0].payload.header.channel_header.timestamp;
		const previousHash = event.header.previous_hash;

		if (height <= await this.getChannelHeight(channelName)) {
			this.logger.debug(`[${channelName}/${height}] Skipped Block: ${shortId}'...'`);
			return;
		}

		this.logger.info(`[${channelName}/${height}] New Block: ${shortId}'...'`);

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

		const transaction = {
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
		};

		this.logger.info(`[${transaction.channelName}/${block.height}] New Transaction: ${transaction.id.substr(0, 16)}'...'`);
		await this.database.addTransaction(transaction);
	}

	private tryJsonParse(value: Buffer) {
		try {
			return JSON.parse(value.toString());
		} catch (error) {
			return value.toString('hex');
		}
	}

	private async getChannelHeight(name: string): Promise<number> {
		if (!this.writeCache[name]) {
			const channel = await this.database.getChannel(name) || { name, height: 0, lastHash: '' };
			this.writeCache[name] = { channel, writePending: false };
			this.logger.info(`[${name}] Loaded height from database: ${channel.height}`);
		}
		return this.writeCache[name].channel.height;
	}

	private updateChannel(channel: Channel): void {
		const previous = this.writeCache[channel.name];
		if (!previous || previous.channel.height < channel.height) {
			this.writeCache[channel.name] = { channel, writePending: true };
		}
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
