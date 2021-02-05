import { Block, BlockQuery, BlockTransactionQuery, Channel, Transaction, TransactionQuery } from '../types';

export type DatabaseAdapter = DatabaseSyncAdapter & DatabaseAPIAdapter;

abstract class DatabaseSyncAdapter {
	public abstract connect(): Promise<void>;
	public abstract setup(channels: string[]): Promise<void>;
	public abstract getChannel(name: string): Promise<Channel>;
	public abstract updateChannel(channel: Channel): Promise<void>;
	public abstract addBlock(block: Block): Promise<void>;
	public abstract addTransaction(transaction: Transaction): Promise<void>;
	public abstract disconnect(): void;
}

abstract class DatabaseAPIAdapter {
	public abstract getBlocks(options: BlockQuery): Promise<Block[]>;
	public abstract getBlockById(id: string): Promise<Block>;
	public abstract getTransactions(options: TransactionQuery): Promise<Transaction[]>;
	public abstract getTransactionById(id: string): Promise<Transaction>;
	public abstract getBlockTransactions(options: BlockTransactionQuery): Promise<Transaction[]>;
	public abstract getChannels(): Promise<Channel[]>;
}

