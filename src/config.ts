import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
	network: {
		path: process.env.EXPLORER_NETWORK_CONFIG || '/config/network-config.json',
		channels: process.env.EXPLORER_NETWORK_CHANNELS,
	},
	db: {
		url: process.env.EXPLORER_DB_URL || 'http://localhost:5984',
	},
	wallet: {
		url: process.env.EXPLORER_WALLET_URL, // couchdb wallets
		path: process.env.EXPLORER_WALLET_PATH, // filesystem wallets
		identity: process.env.EXPLORER_WALLET_IDENTITY || 'admin',
	},
	api: {
		port: parseInt(process.env.PORT, 10) || 4201,
	},
};
