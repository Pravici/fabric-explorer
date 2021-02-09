import 'reflect-metadata';
import { Connection, createConnection, EntityManager } from 'typeorm';
import { OracleConnectionOptions } from 'typeorm/driver/oracle/OracleConnectionOptions';
import {
  Block,
  BlockQuery,
  BlockTransactionQuery,
  Channel,
  Transaction,
  TransactionQuery,
} from '../../types';
import { getLogger } from '../../utilities';
import { DatabaseAdapter } from '../interfaces';
import { OracleBlock, OracleChannel, OracleTransaction } from './entity';

export class OracleDatabase implements DatabaseAdapter {
  protected logger = getLogger('OracleDB');
  protected em: EntityManager;

  private connection: Connection;

  constructor(private readonly connectionOptions: OracleConnectionOptions) {}

  public async connect(): Promise<void> {
    this.connection = await createConnection({
      logging: ['warn'],
      ...this.connectionOptions,
      entities: [OracleBlock, OracleChannel, OracleTransaction],
      synchronize: true,
    });
    this.em = this.connection.manager;
  }

  public disconnect(): void {
    this.connection.close().catch(() => ({}));
  }

  public async setup(channels: string[]): Promise<void> {
    for (const name of channels) {
      const found = await this.em.findOne(OracleChannel, name);
      if (!found) {
        await new OracleChannel({ name, height: 0, lastHash: null }).save();
      }
    }
  }

  public async getChannel(name: string): Promise<Channel> {
    return await this.em.findOne(OracleChannel, name);
  }

  public async updateChannel(channel: Channel): Promise<void> {
    this.logger.info(
      `[${channel.name}] Saved height to database: ${channel.height}`
    );
    await new OracleChannel(channel).save();
  }

  public async addBlock(block: Block): Promise<void> {
    await new OracleBlock(block).save();
  }

  public async addTransaction(transaction: Transaction): Promise<void> {
    await new OracleTransaction(transaction).save();
  }

  public async getChannels(): Promise<Channel[]> {
    return await this.em.find(OracleChannel);
  }

  public async getBlocks(options: BlockQuery): Promise<Block[]> {
    const { size, page, sort, direction, query } = options;
    return await this.em.find(OracleBlock, {
      skip: size * (page - 1),
      take: size,
      where: query,
      order: sort ? { [sort]: direction.toUpperCase() } : null,
    });
  }

  public async getBlockById(id: string): Promise<Block> {
    return await this.em.findOne(OracleBlock, id);
  }

  public async getBlockTransactions(
    options: BlockTransactionQuery
  ): Promise<Transaction[]> {
    const { id, size, page, sort, direction } = options;
    return await this.em.find(OracleTransaction, {
      skip: size * (page - 1),
      take: size,
      where: { blockHash: id },
      order: sort ? { [sort]: direction.toUpperCase() } : null,
    });
  }

  public async getTransactions(
    options: TransactionQuery
  ): Promise<Transaction[]> {
    const { sort, page, direction, size, query } = options;
    return await this.em.find(OracleTransaction, {
      skip: size * (page - 1),
      take: size,
      where: query,
      order: sort ? { [sort]: direction.toUpperCase() } : null,
    });
  }

  public async getTransactionById(id: string): Promise<Transaction> {
    return await this.em.findOne(OracleTransaction, id);
  }
}
