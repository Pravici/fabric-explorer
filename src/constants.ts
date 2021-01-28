import { ColumnType, DatabaseNames, DatabaseTable } from './types';

const length = {
	channelName: 50,
	channelVersion: 10,
	chaincodeName: 50,
	chaincodeVersion: 10,
	hash: 64,
};

export const SCHEMA: DatabaseTable[] = [
	{
		name: DatabaseNames.CHANNELS,
		columns: [
			{ name: 'id', primaryKey: true, type: ColumnType.VARCHAR2 },
			{ name: 'channelName', type: ColumnType.VARCHAR2, length: length.channelName },
			{ name: 'value', type: ColumnType.JSON },
		],
		indexes: [],
	},
	{
		name: DatabaseNames.BLOCKS,
		columns: [
			{ name: 'id', primaryKey: true, type: ColumnType.VARCHAR2, length: length.hash },
			{ name: 'timestamp', type: ColumnType.TIMESTAMP },
			{ name: 'height', type: ColumnType.NUMBER },
			{ name: 'previousHash', type: ColumnType.VARCHAR2, length: length.hash },
			{ name: 'transactions', type: ColumnType.NUMBER },
			{ name: 'channelName', type: ColumnType.VARCHAR2, length: length.channelName },
		],
		indexes: [
			{ name: 'block_timestamp', fields: ['timestamp'] },
			{ name: 'block_height', fields: ['height'] },
			{ name: 'block_channel_name', fields: ['channelName'] },
		],
	},
	{
		name: DatabaseNames.TRANSACTIONS,
		columns: [
			{ name: 'id', primaryKey: true, type: ColumnType.VARCHAR2, length: length.hash },
			{ name: 'type', type: ColumnType.NUMBER },
			{ name: 'timestamp', type: ColumnType.TIMESTAMP },
			{ name: 'blockHash', type: ColumnType.VARCHAR2, length: length.hash },
			{ name: 'blockHeight', type: ColumnType.NUMBER },
			{ name: 'channelName', type: ColumnType.VARCHAR2, length: length.channelName },
			{ name: 'channelVersion', type: ColumnType.VARCHAR2, length: length.channelVersion },
			{ name: 'chaincodeName', type: ColumnType.VARCHAR2, length: length.chaincodeName },
			{ name: 'chaincodeVersion', type: ColumnType.VARCHAR2, length: length.chaincodeVersion },
			{ name: 'chaincodeResponseStatus', type: ColumnType.NUMBER },
			{ name: 'chaincodeResponse', type: ColumnType.JSON },
			{ name: 'chaincodeWrites', type: ColumnType.JSON },
			{ name: 'chaincodeReads', type: ColumnType.JSON },
		],
		indexes: [
			{ name: 'tx_timestamp', fields: ['timestamp'] },
			{ name: 'tx_block_height', fields: ['blockHeight'] },
			{ name: 'tx_block_hash', fields: ['blockHash'] },
			{ name: 'tx_channel_name', fields: ['channelName'] },
			{ name: 'tx_chaincode_name', fields: ['channelName', 'chaincodeName'] },
		],
	},
];
