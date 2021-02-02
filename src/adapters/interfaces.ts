import { Handler } from 'express';
import { Block, Channel, Transaction } from '../types';

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
	public abstract getBlocks(): Handler;
	public abstract getBlockById(): Handler;
	public abstract getTransactions(): Handler;
	public abstract getTransactionById(): Handler;
	public abstract getBlockTransactions(): Handler;
	public abstract getChannels(): Handler;
}

