import * as Nano from 'nano';
import { Request } from 'express';

export interface NanoRequest extends Request {
	nano: Nano.ServerScope,
	transactions: Nano.DocumentScope<Transaction>,
	blocks: Nano.DocumentScope<Block>,
}

export enum DatabaseNames {
	METADATA = 'metadata',
	BLOCKS = 'blocks',
	TRANSACTIONS = 'transactions',
	STATE = 'state',
}

export interface Metadata extends Nano.MaybeDocument {
	channels: {
		[channelName: string]: {
			lastBlock: number;
		};
	};
}

export interface Block extends Nano.MaybeDocument {
	id: string;
	height: number;
	previousHash: string;
	txCount: number;
	channelName: string;
}

export interface Transaction extends Nano.MaybeDocument {
	blockHash: string;
	blockHeight: number;
	txId: string;
	txType: string;
	txTypeString: string;
	txTimestamp: Date;
	channelName: string;
	channelVersion: string;
	chaincodeName: string;
	chaincodeVersion: string;
	chaincodeResponseStatus: string;
	chaincodeResponse: string;
	chaincodeWrites: {
		[key: string]: string | object;
	};
}
