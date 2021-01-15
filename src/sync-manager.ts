import { Gateway } from 'fabric-network';
import * as _ from 'lodash';
import * as Nano from 'nano';
import { Metadata, Block, Transaction, DatabaseNames, METADATA_DOC } from './types';

export class SyncManager {
	private writePending = false;
	private metadata: Metadata & Nano.MaybeDocument = null;
	private timer: NodeJS.Timeout = null;
	private INTERVAL = 5000;
	private listeners = [];
	private logger = console;

	public nano: Nano.ServerScope;
	public gateway: Gateway;

	constructor(dbConfig: string | Nano.Configuration) {
		this.nano = Nano(dbConfig);
		this.gateway = new Gateway();
	}

	public async connect(config, options) {
		this.gateway = this.gateway || new Gateway();
		await this.gateway.connect(config, options);

		const dbInfo = await this.nano.info();
		console.log('DB Info', dbInfo);
	}

	public async start(channels: string[]) {
		await this.setupDatabase();
		await this.loadMetadata();
		this.timer = setInterval(() => this.syncMetadata(), this.INTERVAL);

		for (const channelName of channels) {
			const options = { startBlock: this.getLastBlock(channelName) };
			const channel = await this.gateway.getNetwork(channelName);
			const onEvent = async (error, event) => {
				if (error) {
					this.logger.error(`[${channelName}] Block Event Error: ${error.message}`);
					return;
				}

				try {
					await this.onBlock(event, channelName);
				} catch (exception) {
					this.logger.error(`Unhandled block error: channelName=${channelName}`, exception);
				}
			};
			const listener = await channel.addBlockListener('listener', onEvent, options);
			this.listeners.push(listener);
			this.logger.log(`[${channelName}/${options.startBlock}] Added Block Listener`);
		}
	}

	public teardown() {
		this.logger.log(`Stopping SyncManager`);
		if (this.timer) {
			clearTimeout(this.timer);
		}
		this.logger.info(`Unregistering listeners`);
		for (const listener of this.listeners) {
			listener.unregister();
		}
	}

	private async setupDatabase() {
		const dbs = await this.nano.db.list();
		for (const dbName of Object.values(DatabaseNames)) {
			if (dbs.find(name => name === dbName)) {
				continue;
			}
			this.logger.log(`Creating database: ${dbName}`);
			await this.nano.db.create(dbName);

			if (dbName === DatabaseNames.METADATA.toString()) {
				await this.nano.db.use<Metadata>(dbName).insert({ channels: {} }, METADATA_DOC);
				this.logger.log('Created metadata status document');
			}

			if (dbName === DatabaseNames.BLOCKS.toString()) {
				await this.nano.db.use(dbName).createIndex({ index: { fields: ['timestamp'] } });
				await this.nano.db.use(dbName).createIndex({ index: { fields: ['height'] } });
				await this.nano.db.use(dbName).createIndex({ index: { fields: ['channelName'] } });
				this.logger.log('Created block indexes');
			}

			if (dbName === DatabaseNames.TRANSACTIONS.toString()) {
				await this.nano.db.use(dbName).createIndex({ index: { fields: ['timestamp'] } });
				await this.nano.db.use(dbName).createIndex({ index: { fields: ['blockHeight'] } });
				await this.nano.db.use(dbName).createIndex({ index: { fields: ['blockHash'] } });
				await this.nano.db.use(dbName).createIndex({ index: { fields: ['channelName'] } });
				await this.nano.db.use(dbName).createIndex({ index: { fields: ['channelName', 'chaincodeName'] } });
				this.logger.log('Created transaction indexes');
			}
		}
	}

	private async loadMetadata() {
		this.metadata = await this.nano.db.use<Metadata>(DatabaseNames.METADATA).get(METADATA_DOC);
	}

	private async syncMetadata() {
		const db = this.nano.db.use<Metadata>(DatabaseNames.METADATA);
		if (this.writePending) {
			this.logger.log(`Updating Metadata: ${JSON.stringify(this.metadata)}`);
			const { rev } = await db.insert(this.metadata);
			this.metadata._rev = rev;
			this.writePending = false;
		}
	}

	private getLastBlock(channelName: string) {
		return _.get(this.metadata, `channels.${channelName}.lastBlock`, 1);
	}

	private setLastBlock(channelName: string, lastBlock: number) {
		const previousLastBlock = this.getLastBlock(channelName);
		if (lastBlock > previousLastBlock) {
			this.writePending = true;
			return _.set(this.metadata, `channels.${channelName}.lastBlock`, lastBlock);
		}
	}

	private async onBlock(event: any, channelName: string) {
		const hash = event.header.data_hash;
		const height = parseInt(event.header.number, 10);
		const transactions = _.get(event, 'data.data', []);
		const timestamp = transactions[0].payload.header.channel_header.timestamp;
		const previousHash = event.header.previous_hash;

		if (height < this.getLastBlock(channelName)) {
			this.logger.log(`[${channelName}] Skipped Block (${height})`);
			return;
		}

		await this.addBlock({
			id: hash,
			height,
			timestamp: new Date(timestamp),
			previousHash,
			transactions: transactions.length,
			channelName,
		});

		for (const transactionData of transactions) {
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

			await this.addTransaction({
				blockHash: hash,
				blockHeight: height,
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

		this.setLastBlock(channelName, height);
	}

	private async addBlock(block: Block & Nano.MaybeDocument) {
		const success = await this.nano.db.use(DatabaseNames.BLOCKS).insert(block, block.id).catch(() => null);
		const shortId = block.id.substr(0, 16) + '...';
		if (success) {
			this.logger.log(`[${block.channelName}/${block.height}] New Block: ${shortId}`);
		} else {
			this.logger.log(`[${block.channelName}/${block.height}] Skipped Block: ${shortId}`);
		}
	}

	private async addTransaction(transaction: Transaction & Nano.MaybeDocument) {
		const success = await this.nano.db.use(DatabaseNames.TRANSACTIONS).insert(transaction, transaction.id).catch(() => null);
		const shortId = transaction.id.substr(0, 16) + '...';
		if (success) {
			this.logger.log(`[${transaction.channelName}/${transaction.blockHeight}] New Transaction: ${shortId}`);
		} else {
			this.logger.log(`[${transaction.channelName}/${transaction.blockHeight}] Skipped Transaction: ${shortId}`);
		}
	}

	private tryJsonParse(value) {
		try {
			return JSON.parse(value);
		} catch (error) {
			return value;
		}
	}
}
