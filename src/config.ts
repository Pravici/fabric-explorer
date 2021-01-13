import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
	networkConfigPath: process.env.EXPLORER_NETWORK_CONFIG || 'network-config.json',
	db: {
		url: process.env.EXPLORER_DB_URL || 'http://localhost:5984',
	},
	wallet: {
		url: process.env.EXPLORER_WALLET_URL,
		identity: process.env.EXPLORER_WALLET_IDENTITY || 'explorer',
	},
	api: {
		port: parseInt(process.env.EXPLORER_API_PORT || '4204', 10),
	},
};
