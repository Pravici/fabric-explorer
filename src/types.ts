export enum DatabaseNames {
	METADATA = 'metadata',
	BLOCKS = 'blocks',
	TRANSACTIONS = 'transactions',
	STATE = 'state',
}

export interface Metadata {
	channels: {
		[channelName: string]: {
			lastBlock: number;
		};
	};
}

export const METADATA_DOC = 'status';

export interface State {
	key: string;
	value: any;
}

export interface Block {
	id: string;
	timestamp: Date;
	height: number;
	previousHash: string;
	transactions: number;
	channelName: string;
}

export interface Transaction {
	blockHash: string;
	blockHeight: number;
	id: string;
	type: string;
	typeString: string;
	timestamp: Date;
	channelName: string;
	channelVersion: string;
	chaincodeName: string;
	chaincodeVersion: string;
	chaincodeResponseStatus: string;
	chaincodeResponse: string;
	chaincodeWrites: {
		[key: string]: string | object;
	};
	chaincodeReads: {
		[key: string]: {
			block: number;
			transaction: number;
		};
	};
}
