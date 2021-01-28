import { Express } from 'express';
import { CouchDBWallet, FileSystemWallet, GatewayOptions, Wallet } from 'fabric-network';
import * as fs from 'fs';
import * as _ from 'lodash';
import { CouchAPI, CouchDatabase, DatabaseSyncAdapter, OracleDatabase } from './adapters';
import { ExplorerAPI } from './explorer-api';
import { ExplorerSync } from './explorer-sync';
import { ChannelOption } from './types';
import { abort, getLogger } from './utilities';

const logger = getLogger();

type ExplorerOptions = Partial<{
	couchdb: ConstructorParameters<typeof CouchDatabase>[0];
	oracledb: ConstructorParameters<typeof OracleDatabase>[0];
	database: DatabaseSyncAdapter;
	api: boolean | ExplorerAPI;
	writeInterval: number;
	channels: string | Array<string | ChannelOption>;
	walletPath: string;
	walletUrl: string;
	networkConfig: string | object;
	networkConfigPath: string;
} & GatewayOptions>;

export class Explorer {
	private sync: ExplorerSync;
	private api: ExplorerAPI;

	constructor(options?: ExplorerOptions) {
		options = options || {};
		options.couchdb = options.couchdb || process.env.EXPLORER_COUCHDB_URL;
		options.oracledb = options.oracledb || process.env.EXPLORER_ORACLEDB_URL;
		options.writeInterval = options.writeInterval || parseInt(process.env.EXPLORER_WRITE_INTERVAL, 10) || 5000;
		options.channels = options.channels || process.env.EXPLORER_NETWORK_CHANNELS || [];
		options.networkConfig = options.networkConfig || process.env.EXPLORER_NETWORK_CONFIG;
		options.networkConfigPath = options.networkConfigPath || process.env.EXPLORER_NETWORK_CONFIG_PATH || '/config/network-config.json';
		options.identity = options.identity || process.env.EXPLORER_WALLET_IDENTITY || 'admin';
		options.walletUrl = options.walletUrl || process.env.EXPLORER_WALLET_URL;
		options.walletPath = options.walletPath || process.env.EXPLORER_WALLET_PATH;

		options.wallet = this.getWallet(options);
		options.networkConfig = this.getNetworkConfig(options);
		options.database = this.getDatabase(options);

		const gatewayOptions = this.getGatewayOptions(options);
		const channels = this.getChannels(options);
		const { networkConfig, database, writeInterval } = options;

		this.sync = new ExplorerSync({
			networkConfig,
			gatewayOptions,
			channels,
			database,
			options: { writeInterval },
		});

		this.api = new ExplorerAPI({ api: new CouchAPI(options.couchdb) });
	}

	public async start() {
		logger.info(`Starting`);
		await this.sync.start();
	}

	public stop() {
		logger.info(`Stopping`);
		this.sync.stop();
	}

	public async applyMiddleware({ app, path }: { app: Express, path: string }) {
		this.api.applyMiddleware({ app, path });
	}

	private getNetworkConfig({ networkConfig, networkConfigPath }: ExplorerOptions): any {
		try {
			networkConfig = networkConfig || fs.readFileSync(networkConfigPath).toString();
		} catch (error) {
			abort(`[Explorer] Unable to read network config from "${networkConfigPath}"`, error);
		}

		try {
			if (typeof networkConfig === 'string') {
				networkConfig = JSON.parse(networkConfig);
			}
		} catch (error) {
			abort(`[Explorer] Unable to convert network config to json: config="${networkConfig}"`, error);
		}

		return networkConfig;
	}

	private getChannels({ channels, networkConfig }: ExplorerOptions): ChannelOption[] {
		if (typeof channels === 'string') {
			channels = channels.split(',');
		}

		if (channels.length === 0) {
			channels = Object.keys((networkConfig as any).channels || {}) as string[];
			logger.info(`[Explorer] Found channels from network config: ${channels.join(',')}`);
		}

		const channelsOptions: ChannelOption[] = channels.map(channel => {
			if (typeof channel === 'string') {
				channel = { name: channel, options: { startBlock: 'auto' } };
			}
			return channel;
		});

		if (channelsOptions.length === 0) {
			abort('[Explorer] Unable to find any channels');
		}

		return channelsOptions;
	}

	private getDatabase({ database, oracledb, couchdb }: ExplorerOptions): DatabaseSyncAdapter {
		if (database) {
			return database;
		}
		if (oracledb) {
			return new OracleDatabase(oracledb);
		}
		if (couchdb) {
			return new CouchDatabase(couchdb);
		}

		logger.info('[Explorer] Using default CouchDatabase');
		return new CouchDatabase('http://localhost:5984');
	}

	private getGatewayOptions(options: ExplorerOptions): GatewayOptions {
		const gatewayOptions = {
			wallet: options.wallet,
			identity: options.identity,
			clientTlsIdentity: options.clientTlsIdentity,
			discovery: options.discovery,
			eventHandlerOptions: options.eventHandlerOptions,
			queryHandlerOptions: options.queryHandlerOptions,
			checkpointer: options.checkpointer,
		};
		return _.omitBy(gatewayOptions, _.isNil) as GatewayOptions;
	}

	private getWallet({ wallet, walletUrl, walletPath }: ExplorerOptions): Wallet {
		if (wallet) {
			return wallet;
		}
		if (walletUrl) {
			return new CouchDBWallet({ url: walletUrl });
		}
		if (walletPath) {
			return new FileSystemWallet(walletPath);
		}
		return new FileSystemWallet('wallet');
	}
}
