export interface Channel {
	name: string;
	height: number;
	lastHash: string;
}

export interface State {
	channelName: string;
	chaincodeName: string;
	blockHash: string;
	blockHeight: string;
	stateKey: string;
	stateValue: any;
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
	id: string;
	type: number;
	typeString: string;
	timestamp: Date;
	blockHash: string;
	blockHeight: number;
	channelName: string;
	channelVersion: string;
	chaincodeName: string;
	chaincodeVersion: string;
	chaincodeResponseStatus: number;
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

export enum DatabaseNames {
	CHANNELS = 'channels',
	BLOCKS = 'blocks',
	TRANSACTIONS = 'transactions',
	STATE = 'state',
}

export interface DatabaseIndex {
	name: string;
	fields: string[];
}

export interface ChannelOption {
	name: string;
	options: {
		startBlock: 'auto' | number;
	};
}
