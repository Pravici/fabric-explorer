import { Express } from 'express';
import { DatabaseAdapter } from './adapters';
import { ExplorerAPI } from './explorer-api';
import { ExplorerOptions } from './explorer-options';
import { ExplorerSync } from './explorer-sync';
import { getLogger } from './utilities';

export class Explorer {
	private api: ExplorerAPI;
	private sync: ExplorerSync;
	private database: DatabaseAdapter;

	private logger = getLogger();

	constructor(options?: ConstructorParameters<typeof ExplorerOptions>[0]) {
		const _options = new ExplorerOptions(options);

		this.sync = new ExplorerSync(_options.getSyncOptions());
		this.database = _options.getDatabase();
	}

	public async start() {
		this.logger.info(`Starting`);
		await this.sync.start();
	}

	public stop() {
		this.logger.info(`Stopping`);
		this.sync.stop();
	}

	public applyMiddleware({ app, path }: { app: Express, path: string }) {
		this.api = new ExplorerAPI(this.database);
		this.api.applyMiddleware({ app, path });
	}
}
