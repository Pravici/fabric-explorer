import { Express, NextFunction, Request, Response, Router } from 'express';
import { DatabaseAdapter } from './adapters';
import { getLogger } from './utilities';

const logger = getLogger('API');

export class ExplorerAPI {
	constructor(private api: DatabaseAdapter) { }

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
