import * as dotenv from 'dotenv';
import { CouchDBWallet, FileSystemWallet, GatewayOptions, Wallet } from 'fabric-network';
import * as fs from 'fs';
import * as _ from 'lodash';
import { OracleConnectionOptions } from 'typeorm/driver/oracle/OracleConnectionOptions';
import { CouchDatabase, DatabaseAdapter, OracleDatabase } from './adapters';
import { ExplorerAPI } from './explorer-api';
import { ChannelOption } from './types';
import { abort, getLogger } from './utilities';

dotenv.config();

type Options = Partial<{
	couchdb: ConstructorParameters<typeof CouchDatabase>[0];
	oracledb: ConstructorParameters<typeof OracleDatabase>[0];
	database: DatabaseAdapter;
	api: boolean | ExplorerAPI;
	writeInterval: number;
	channels: string | Array<string | ChannelOption>;
	walletPath: string;
	walletUrl: string;
	networkConfig: string | object;
	networkConfigPath: string;
} & GatewayOptions>;

export class ExplorerOptions {
	private logger = getLogger('OptionsParser');

	private gatewayOptions: GatewayOptions;
	private networkConfig: string | object;
	private channels: ChannelOption[];

	private database: DatabaseAdapter;
	private writeInterval: number;

	constructor(options: Options = {}) {
		this.gatewayOptions = this.parseGatewayOptions(options);
		this.networkConfig = this.parseNetworkConfig(options);
		this.channels = this.parseChannels(options);
		this.database = this.parseDatabase(options);
		this.writeInterval = this.parseWriteInterval(options);
	}

	public getSyncOptions() {
		const { networkConfig, gatewayOptions, channels, database, writeInterval } = this;
		return { networkConfig, gatewayOptions, channels, database, options: { writeInterval } };
	}

	public getDatabase() {
		return this.database;
	}

	private parseGatewayOptions(options: Options): GatewayOptions {
		const { checkpointer, clientTlsIdentity, discovery, eventHandlerOptions, queryHandlerOptions } = options;
		const gatewayOptions = {
			wallet: this.parseWallet(options),
			identity: this.parseWalletIdentity(options),
			clientTlsIdentity,
			discovery,
			eventHandlerOptions,
			queryHandlerOptions,
			checkpointer,
		};
		return _.omitBy(gatewayOptions, _.isNil) as GatewayOptions;
	}

	private parseWallet({ wallet, walletUrl, walletPath }: Options): Wallet {
		walletUrl = walletUrl || process.env.EXPLORER_WALLET_URL;
		walletPath = walletPath || process.env.EXPLORER_WALLET_PATH;

		if (wallet) {
			return wallet;
		}
		if (walletUrl) {
			return new CouchDBWallet({ url: walletUrl });
		}
		if (walletPath) {
			return new FileSystemWallet(walletPath);
		}

		this.logger.warn(`Using default wallet: FilesystemWallet('wallet')`);

		return new FileSystemWallet('wallet');
	}

	private parseWalletIdentity({ identity }: Options) {
		identity = identity || process.env.EXPLORER_WALLET_IDENTITY;
		if (identity) {
			return identity;
		}

		identity = 'admin';
		this.logger.warn(`Using default wallet identity: "${identity}"`);

		return identity;
	}

	private parseWriteInterval({ writeInterval }: Options): number {

		writeInterval = writeInterval || parseInt(process.env.EXPLORER_WRITE_INTERVAL, 10);
		if (writeInterval) {
			return writeInterval;
		}

		writeInterval = 5000;
		this.logger.warn(`Using default write interval: "${writeInterval}"`);

		return writeInterval;
	}

	private parseNetworkConfig({ networkConfig, networkConfigPath }: Options): any {
		networkConfig = networkConfig || process.env.EXPLORER_NETWORK_CONFIG;

		if (!networkConfig) {
			networkConfigPath = networkConfigPath || process.env.EXPLORER_NETWORK_CONFIG_PATH;

			if (!networkConfigPath) {
				networkConfigPath = '/config/network-config.json';
				this.logger.warn(`Using default network config path: "${networkConfigPath}"`);
			}

			try {
				networkConfig = fs.readFileSync(networkConfigPath).toString();
			} catch (error) {
				this.logger.error(`Unable to read network config from path: "${networkConfigPath}"`);
				abort(`Invalid network config`, error);
			}
		}

		try {
			if (typeof networkConfig === 'string') {
				networkConfig = JSON.parse(networkConfig);
			}
		} catch (error) {
			abort(`Invalid JSON in network config: config="${networkConfig}"`, error);
		}

		return networkConfig;
	}

	private parseChannels({ channels }: Options): ChannelOption[] {
		channels = channels || process.env.EXPLORER_NETWORK_CHANNELS || [];

		if (typeof channels === 'string') {
			channels = channels.split(',');
		}

		if (channels.length === 0) {
			this.logger.warn(`No channels provided, checking network config`);
			channels = Object.keys((this.networkConfig as any).channels || {}) as string[];
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

		this.logger.info(`Using channels: ${channelsOptions.map(c => `${c.name}=${c.options.startBlock}`).join(',')}`);

		return channelsOptions;
	}

	private parseDatabase({ database, oracledb, couchdb }: Options): DatabaseAdapter {
		if (database) {
			return database;
		}

		oracledb = oracledb || {} as OracleConnectionOptions;
		oracledb = {
			type: 'oracle',
			connectString: oracledb.connectString || process.env.EXPLORER_ORACLEDB_URL,
			username: oracledb.username || process.env.EXPLORER_ORACLEDB_USER,
			password: oracledb.password || process.env.EXPLORER_ORACLEDB_PASSWORD,
		};

		if (oracledb && oracledb.connectString) {
			return new OracleDatabase(oracledb);
		}

		couchdb = couchdb || process.env.EXPLORER_COUCHDB_URL;
		if (couchdb) {
			return new CouchDatabase(couchdb);
		}

		this.logger.warn(`Using default database: CouchDatabase('http://localhost:5984'))`);

		return new CouchDatabase('http://localhost:5984');
	}
}
