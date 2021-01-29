import 'reflect-metadata';
import { Connection, createConnection, EntityManager } from 'typeorm';
import { OracleConnectionOptions } from 'typeorm/driver/oracle/OracleConnectionOptions';
import * as entity from '../entity';
import { Block, Channel, DatabaseTable, Transaction } from '../types';
import { getLogger } from '../utilities';
import { DatabaseSyncAdapter } from './interfaces';

export class OracleDatabase implements DatabaseSyncAdapter {
	private logger = getLogger('OracleDB');
	private em: EntityManager;

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

	public async setup(tables: DatabaseTable[], channels: string[]): Promise<void> {
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
}
