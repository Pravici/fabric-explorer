import { Handler, NextFunction, Request, Response } from 'express';
import * as _ from 'lodash';
import * as Nano from 'nano';
import { Block, Channel, DatabaseNames, DatabaseTable, State, Transaction } from '../types';
import { getLogger, stripMetadata } from '../utilities';
import { DatabaseAPIAdapter, DatabaseSyncAdapter } from './interfaces';

const logger = getLogger('CouchAPI');

export class CouchDatabase implements DatabaseSyncAdapter {
	protected nano: Nano.ServerScope;
	protected channels: Nano.DocumentScope<Channel>;
	protected blocks: Nano.DocumentScope<Block>;
	protected transactions: Nano.DocumentScope<Transaction>;
	protected state: Nano.DocumentScope<State>;

	constructor(dbConfig: string | Nano.Configuration) {
		this.nano = Nano(dbConfig);

		this.channels = this.nano.db.use<Channel>(DatabaseNames.CHANNELS);
		this.blocks = this.nano.db.use<Block>(DatabaseNames.BLOCKS);
		this.transactions = this.nano.db.use<Transaction>(DatabaseNames.TRANSACTIONS);
		this.state = this.nano.db.use<State>(DatabaseNames.STATE);
	}

	public async setup(tables: DatabaseTable[], channels: string[]): Promise<void> {
		const dbs = await this.nano.db.list();
		for (const { name: dbName, indexes } of tables) {
			if (dbs.find(name => name === dbName)) {
				continue;
			}

			logger.info(`Creating table: ${dbName}`);
			await this.nano.db.create(dbName);

			const db = await this.nano.db.use(dbName);
			for (const { name, fields } of indexes) {
				await db.createIndex({ name, index: { fields } });
			}
		}

		for (const channelName of channels) {
			this.channels.insert({ name: channelName, height: 0, lastHash: '' }, channelName).catch(() => { });
		}
	}

	public async getChannel(name: string): Promise<Channel> {
		const { height, lastHash } = await this.channels.get(name);
		return { name, height, lastHash };
	}

	public async updateChannel(channel: Channel): Promise<void> {
		const { _rev, height } = await this.channels.get(channel.name);
		if (channel.height > height) {
			logger.info(`Updating channel: ${JSON.stringify(channel)}`);
			await this.channels.insert({ _id: channel.name, ...channel, _rev });
		}
	}

	public async addBlock(block: Block): Promise<void> {
		const success = await this.blocks
			.insert(block, block.id)
			.catch(() => null);
		const shortId = block.id.substr(0, 16) + '...';
		const prefix = `${block.channelName}/${block.height}`;
		if (success) {
			logger.info(`[${prefix}] New Block: ${shortId}`);
		} else {
			logger.debug(`[${prefix}] Skipped Block:       ${shortId}`);
		}
	}

	public async addTransaction(transaction: Transaction) {
		const success = await this.transactions
			.insert(transaction, transaction.id)
			.catch(() => null);
		const shortId = transaction.id.substr(0, 16) + '...';
		const prefix = `${transaction.channelName}/${transaction.blockHeight}`;
		if (success) {
			logger.info(`[${prefix}] New Transaction: ${shortId}`);
		} else {
			logger.debug(`[${prefix}] Skipped Transaction: ${shortId}`);
		}
	}
}

export class CouchAPI extends CouchDatabase implements DatabaseAPIAdapter {

	constructor(dbConfig: string | Nano.Configuration) {
		super(dbConfig);
	}

	public getChannels(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const { rows } = await this.channels.list({ include_docs: true });
				return res.send(stripMetadata(rows.map(row => row.doc)));
			} catch (error) {
				return next(error);
			}
		};
	}

	public getBlocks(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const limit = req.query.limit as string;
				const q: Nano.MangoQuery = {
					selector: _.omitBy({
						id: req.query.id,
						height: parseInt(req.query.height as string, 10) || null,
						chaincodeName: req.query.chaincodeName,
						channelName: req.query.channelName,
					}, _.isNil),
					limit: parseInt(limit, 10) || 25,
					sort: [{ timestamp: 'desc' }],
					bookmark: req.query.bookmark as string,
				};
				const { docs, bookmark } = await this.blocks.find(q);
				return res.send({ blocks: stripMetadata(docs), bookmark });
			} catch (error) {
				return next(error);
			}
		};
	}

	public getBlockById(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const block = await this.blocks.get(req.params.id);
				return res.send(stripMetadata(block));
			} catch (error) {
				return next(error);
			}
		};
	}

	public getBlockTransactions(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const q: Nano.MangoQuery = {
					selector: { blockHash: req.params.id },
					limit: 25,
					sort: [{ timestamp: 'asc' }],
					bookmark: req.query.bookmark as string,
				};
				const { docs, bookmark } = await this.transactions.find(q);
				return res.send({ transactions: stripMetadata(docs), bookmark });
			} catch (error) {
				return next(error);
			}
		};
	}

	public getTransactions(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const limit = req.query.limit as string;
				const q: Nano.MangoQuery = {
					selector: _.omitBy({
						id: req.query.id,
						blockHash: req.query.blockHash,
						blockHeight: parseInt(req.query.blockHeight as string, 10) || null,
						chaincodeName: req.query.chaincodeName,
						channelName: req.query.channelName,
					}, _.isNil),
					limit: limit ? parseInt(limit, 10) : 25,
					sort: [{ timestamp: 'desc' }],
					bookmark: req.query.bookmark as string,
				};
				const { docs, bookmark } = await this.transactions.find(q);
				return res.send({ transactions: stripMetadata(docs), bookmark });
			} catch (error) {
				return next(error);
			}
		};
	}

	public getTransactionById(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				return res.send(stripMetadata(await this.transactions.get(req.params.id)));
			} catch (error) {
				return next(error);
			}
		};
	}
}
