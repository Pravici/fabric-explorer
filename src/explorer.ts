import { Express, NextFunction, Request, Response, Router } from 'express';
import { DatabaseAdapter } from './adapters';
import { ExplorerOptions } from './explorer-options';
import { ExplorerSync } from './explorer-sync';
import { getLogger } from './utilities';

const logger = getLogger();

export class Explorer {
	private sync: ExplorerSync;
	private database: DatabaseAdapter;

	constructor(options?: ConstructorParameters<typeof ExplorerOptions>[0]) {
		const _options = new ExplorerOptions(options);

		this.sync = new ExplorerSync(_options.getSyncOptions());
		this.database = _options.getDatabase();
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
		app.use(path, Router()
			.get('/channels', this.database.getChannels())
			.get(['/blocks', '/blocks/recent'], this.database.getBlocks())
			.get('/blocks/:id', this.database.getBlockById())
			.get('/blocks/:id/transactions', this.database.getBlockTransactions())
			.get(['/transactions', 'transactions/recent'], this.database.getTransactions())
			.get('/transactions/:id', this.database.getTransactionById())
			.use((error: any, req: Request, res: Response, next: NextFunction) => {
				logger.info(error);
				res.status(error.statusCode || 500).send({ error: true, message: error.message || error });
			}),
		);
	}
}
