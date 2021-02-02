import { Handler, NextFunction, Request, Response } from 'express';
import * as _ from 'lodash';
import 'reflect-metadata';
import { Connection, createConnection, EntityManager } from 'typeorm';
import { OracleConnectionOptions } from 'typeorm/driver/oracle/OracleConnectionOptions';
import * as entity from '../entity';
import { Block, Channel, Transaction } from '../types';
import { getLogger } from '../utilities';
import { DatabaseAdapter } from './interfaces';

export class OracleDatabase implements DatabaseAdapter {
	protected logger = getLogger('OracleDB');
	protected em: EntityManager;

	private connection: Connection;
	private connectionOptions: OracleConnectionOptions;

	constructor(connectionOptions: OracleConnectionOptions) {
		this.connectionOptions = connectionOptions;
	}

	public async connect(): Promise<void> {
		this.connection = await createConnection(
			{
				...this.connectionOptions,
				entities: [
					entity.Channel,
					entity.Transaction,
					entity.Block,
				],
				synchronize: true,
				logging: ['warn'],
			});
		this.em = this.connection.manager;
	}

	public disconnect(): void {
		this.connection.close().catch(() => { });
	}

	public async setup(channels: string[]): Promise<void> {
		for (const name of channels) {
			const found = await this.em.findOne(entity.Channel, name);
			if (!found) {
				await new entity.Channel({ name, height: 0, lastHash: null }).save();
			}
		}
	}

	public async getChannel(name: string): Promise<Channel> {
		return await this.em.findOne(entity.Channel, name) || { height: 0, lastHash: null, name };
	}

	public async updateChannel(channel: Channel): Promise<void> {
		this.logger.info(`[${channel.name}] Saved height to database: ${channel.height}`);
		await new entity.Channel(channel).save();
	}

	public async addBlock(block: Block): Promise<void> {
		await new entity.Block(block).save();
	}

	public async addTransaction(transaction: Transaction): Promise<void> {
		await new entity.Transaction(transaction).save();
	}

	public getChannels(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const channels = await this.em.find(entity.Channel);
				return res.send(channels);
			} catch (error) {
				return next(error);
			}
		};
	}

	public getBlocks(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const blocks = await this.em.find(entity.Block, {
					where: _.omitBy({
						id: req.query.id,
						height: parseInt(req.query.height as string, 10) || null,
						channelName: req.query.channelName,
						chaincodeName: req.query.chaincodeName,
					}, _.isNil),
					order: { timestamp: 'DESC' },
					take: parseInt(req.query.limit as string, 10) || 25,
				});
				return res.send(blocks);
			} catch (error) {
				return next(error);
			}
		};
	}

	public getBlockById(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const block = await this.em.findOne(entity.Block, req.params.id);
				return res.send(block);
			} catch (error) {
				return next(error);
			}
		};
	}

	public getBlockTransactions(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const transactions = await this.em.find(entity.Transaction, {
					take: 25,
					where: { blockHash: req.params.id },
					order: { timestamp: 'DESC' },
				});
				return res.send(transactions);
			} catch (error) {
				return next(error);
			}
		};
	}

	public getTransactions(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const transactions = await this.em.find(entity.Transaction, {
					where: _.omitBy({
						id: req.query.id,
						blockHeight: parseInt(req.query.blockHeight as string, 10) || null,
						blockHash: req.query.blockHash,
						channelName: req.query.channelName,
						chaincodeName: req.query.chaincodeName,
					}, _.isNil),
					order: { timestamp: 'DESC' },
					take: parseInt(req.query.limit as string, 10) || 25,
				});
				return res.send(transactions);
			} catch (error) {
				return next(error);
			}
		};
	}

	public getTransactionById(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const transaction = await this.em.findOne(entity.Transaction, req.params.id);
				return res.send(transaction);
			} catch (error) {
				return next(error);
			}
		};
	}
}
