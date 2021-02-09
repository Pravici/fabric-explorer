import * as Nano from 'nano';
import {
  Block,
  BlockQuery,
  BlockTransactionQuery,
  Channel,
  DatabaseNames,
  State,
  Transaction,
  TransactionQuery,
} from '../../types';
import { getLogger } from '../../utilities';
import { DatabaseAdapter } from './../interfaces';

const TABLES = [
  {
    name: DatabaseNames.CHANNELS.toLowerCase(),
    indexes: [],
  },
  {
    name: DatabaseNames.BLOCKS.toLowerCase(),
    indexes: [
      { name: 'block_timestamp', fields: ['timestamp'] },
      { name: 'block_height', fields: ['height'] },
      { name: 'block_channel_name', fields: ['channelName'] },
    ],
  },
  {
    name: DatabaseNames.TRANSACTIONS.toLowerCase(),
    indexes: [
      { name: 'tx_timestamp', fields: ['timestamp'] },
      { name: 'tx_block_height', fields: ['blockHeight'] },
      { name: 'tx_block_hash', fields: ['blockHash'] },
      { name: 'tx_channel_name', fields: ['channelName'] },
      { name: 'tx_chaincode_name', fields: ['channelName', 'chaincodeName'] },
    ],
  },
];

export class CouchDatabase implements DatabaseAdapter {
  protected logger = getLogger('CouchDB');
  protected nano: Nano.ServerScope;
  protected channels: Nano.DocumentScope<Channel>;
  protected blocks: Nano.DocumentScope<Block>;
  protected transactions: Nano.DocumentScope<Transaction>;
  protected state: Nano.DocumentScope<State>;

  constructor(dbConfig: string | Nano.Configuration) {
    this.nano = Nano(dbConfig);

    this.channels = this.nano.db.use<Channel>(
      DatabaseNames.CHANNELS.toLowerCase()
    );
    this.blocks = this.nano.db.use<Block>(DatabaseNames.BLOCKS.toLowerCase());
    this.transactions = this.nano.db.use<Transaction>(
      DatabaseNames.TRANSACTIONS.toLowerCase()
    );
    this.state = this.nano.db.use<State>(DatabaseNames.STATE.toLowerCase());
  }

  public async connect(): Promise<void> {
    const databases = await this.nano.db.list();
    this.logger.debug(`Found: ${databases.join(',')}`);
  }

  public async disconnect(): Promise<void> {
    // noop
  }

  public async setup(channels: string[]): Promise<void> {
    const dbs = await this.nano.db.list();

    for (const { name: dbName, indexes } of TABLES) {
      if (dbs.find((name) => name === dbName)) {
        continue;
      }

      this.logger.info(`Creating table: ${dbName}`);
      await this.nano.db.create(dbName);

      const db = await this.nano.db.use(dbName);
      for (const { name, fields } of indexes) {
        await db.createIndex({ name, index: { fields } });
      }
    }

    for (const channelName of channels) {
      await this.channels
        .insert({ name: channelName, height: 0, lastHash: '' }, channelName)
        .catch(() => ({}));
    }
  }

  public async getChannel(name: string): Promise<Channel> {
    const { height, lastHash } = await this.channels.get(name);
    return { name, height, lastHash };
  }

  public async updateChannel(channel: Channel): Promise<void> {
    const { _rev, height: previousHeight } = await this.channels.get(
      channel.name
    );
    if (channel.height > previousHeight) {
      await this.channels.insert({ _id: channel.name, ...channel, _rev });
      this.logger.info(
        `[${channel.name}] Saved height to database: ${previousHeight}=>${channel.height}`
      );
    }
  }

  public async addBlock(block: Block): Promise<void> {
    await this.blocks.insert(block, block.id).catch(() => null);
  }

  public async addTransaction(transaction: Transaction): Promise<void> {
    await this.transactions
      .insert(transaction, transaction.id)
      .catch(() => null);
  }

  public async getChannels(): Promise<Channel[]> {
    const { rows } = await this.channels.list({ include_docs: true });
    return this.cleanAll(rows.map((row) => row.doc));
  }

  public async getBlocks({
    sort,
    page,
    direction,
    size,
    query,
  }: BlockQuery): Promise<Block[]> {
    const { docs } = await this.blocks.find({
      skip: size * (page - 1),
      limit: size,
      selector: query,
      sort: sort ? [{ [sort]: direction }] : null,
    });
    return this.cleanAll(docs);
  }

  public async getBlockById(id: string): Promise<Block> {
    const block = await this.blocks.get(id);
    return this.cleanOne(block);
  }

  public async getBlockTransactions({
    id,
    sort,
    page,
    direction,
    size,
  }: BlockTransactionQuery): Promise<Transaction[]> {
    const { docs } = await this.transactions.find({
      skip: size * (page - 1),
      limit: size,
      selector: { blockHash: id },
      sort: sort ? [{ [sort]: direction }] : null,
    });
    return this.cleanAll(docs);
  }

  public async getTransactions({
    sort,
    page,
    direction,
    size,
    query,
  }: TransactionQuery): Promise<Transaction[]> {
    const { docs } = await this.transactions.find({
      skip: size * (page - 1),
      limit: size,
      selector: query,
      sort: sort ? [{ [sort]: direction }] : null,
    });
    return this.cleanAll(docs);
  }

  public async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.transactions.get(id);
    return this.cleanOne(transaction);
  }

  private cleanOne<T>(doc: T & Nano.MaybeDocument) {
    if (!doc) {
      return null;
    }
    delete doc._id;
    delete doc._rev;
    return doc;
  }

  private cleanAll<T>(docs: Array<T & Nano.MaybeDocument>) {
    return docs.map((doc) => this.cleanOne(doc));
  }
}
