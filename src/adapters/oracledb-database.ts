import { Block, Channel, DatabaseTable, Transaction } from '../types';
import { DatabaseSyncAdapter } from './interfaces';

export class OracleDatabase implements DatabaseSyncAdapter {
	constructor(options: any) {
		// TODO
	}

	public connect(): Promise<void> {
		return null;
	}
	public setup(tables: DatabaseTable[], channels: string[]): Promise<void> {
		return null;
	}
	public getChannel(name: string): Promise<Channel> {
		return null;
	}
	public updateChannel(channel: Channel): Promise<void> {
		return null;
	}
	public addBlock(block: Block): Promise<void> {
		return null;
	}
	public addTransaction(transaction: Transaction): Promise<void> {
		return null;
	}
}
