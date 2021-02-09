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
  stateValue: ChaincodeObject;
}

export interface Block {
  id: string;
  timestamp: Date;
  height: number;
  previousHash: string;
  transactions: number;
  channelName: string;
}

export interface BlockQuery {
  page: number;
  size: number;
  sort: string;
  direction: 'asc' | 'desc';
  query: {
    id?: string;
    height?: number;
    channelName?: string;
    chaincodeName?: string;
  };
}

export interface BlockTransactionQuery {
  id: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface ChaincodeObject {
  [key: string]: string | number | ChaincodeObject;
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
  chaincodeResponse: ChaincodeObject;
  chaincodeWrites: ChaincodeObject;
  chaincodeReads: {
    [key: string]: {
      block: number;
      transaction: number;
    };
  };
}

export interface TransactionQuery {
  page: number;
  size: number;
  sort: string;
  direction: 'asc' | 'desc';
  query: {
    id?: string;
    blockHeight?: number;
    blockHash?: string;
    channelName?: string;
    chaincodeName?: string;
  };
}

export enum DatabaseNames {
  CHANNELS = 'FABRIC_EXPLORER_CHANNELS',
  BLOCKS = 'FABRIC_EXPLORER_BLOCKS',
  TRANSACTIONS = 'FABRIC_EXPLORER_TRANSACTIONS',
  STATE = 'FABRIC_EXPLORER_STATE',
}
