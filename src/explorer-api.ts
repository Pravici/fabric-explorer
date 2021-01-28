import { Express, NextFunction, Request, Response, Router } from 'express';
import { DatabaseAPIAdapter } from './adapters';
import { getLogger } from './utilities';

const logger = getLogger('API');

type APIOptions = { api: DatabaseAPIAdapter };

export class ExplorerAPI {
	private api: DatabaseAPIAdapter;

	constructor({ api }: APIOptions) {
		this.api = api;
	}

	public applyMiddleware({ app, path }: { app: Express, path: string }) {
		app.use(path, Router()
			.get('/channels', this.api.getChannels())
			.get(['/blocks', '/blocks/recent'], this.api.getBlocks())
			.get('/blocks/:id', this.api.getBlockById())
			.get('/blocks/:id/transactions', this.api.getBlockTransactions())
			.get(['/transactions', 'transactions/recent'], this.api.getTransactions())
			.get('/transactions/:id', this.api.getTransactionById())
			.use((error: any, req: Request, res: Response, next: NextFunction) => {
				logger.info(error);
				res.status(error.statusCode || 500).send({ error: true, message: error.message || error });
			}),
		);
	}
}
