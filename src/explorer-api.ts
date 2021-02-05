import { Express, Handler, NextFunction, Request, Response, Router } from 'express';
import * as _ from 'lodash';
import { DatabaseAdapter } from './adapters';
import { BlockQuery, BlockTransactionQuery, TransactionQuery } from './types';
import { getLogger } from './utilities';

const logger = getLogger('API');

export class ExplorerAPI {
	constructor(private api: DatabaseAdapter) { }

	public applyMiddleware({ app, path }: { app: Express, path: string }) {
		app.use(path, Router()
			.get('/channels', this.getChannels())
			.get(['/blocks', '/blocks/recent'], this.getBlocks())
			.get('/blocks/:id', this.getBlockById())
			.get('/blocks/:id/transactions', this.getBlockTransactions())
			.get(['/transactions', 'transactions/recent'], this.getTransactions())
			.get('/transactions/:id', this.getTransactionById())
			.use((error: any, req: Request, res: Response, next: NextFunction) => {
				logger.info(error);
				res.status(error.statusCode || 500).send({ error: true, message: error.message || error });
			}),
		);
	}

	private getChannels(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const channels = await this.api.getChannels();
				return res.send(channels);
			} catch (error) {
				return next(error);
			}
		};
	}

	private getBlocks(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const options: BlockQuery = {
					page: parseInt(req.query.page as string, 10) || 1,
					size: parseInt(req.query.size as string, 10) || 25,
					sort: req.query.sort as string || 'timestamp',
					direction: req.query.direction === 'asc' ? 'asc' : 'desc',
					query: _.omitBy({
						id: req.query.id as string,
						height: parseInt(req.query.height as string, 10) || null,
						channelName: req.query.channelName as string || null,
						chaincodeName: req.query.chaincodeName as string || null,
					}, _.isNil),
				};
				const blocks = await this.api.getBlocks(options);
				return res.send(blocks);
			} catch (error) {
				return next(error);
			}
		};
	}

	private getBlockTransactions(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const options: BlockTransactionQuery = {
					page: parseInt(req.query.page as string, 10) || 1,
					size: parseInt(req.query.size as string, 10) || 25,
					sort: req.query.sort as string || 'timestamp',
					direction: req.query.direction === 'desc' ? 'desc' : 'asc',
					id: req.params.id,
				};
				const blocks = await this.api.getBlockTransactions(options);
				return res.send(blocks);
			} catch (error) {
				return next(error);
			}
		};
	}

	private getBlockById(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const id = req.params.id;
				const block = await this.api.getBlockById(id);
				return res.send(block);
			} catch (error) {
				return next(error);
			}
		};
	}

	private getTransactions(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const options: TransactionQuery = {
					page: parseInt(req.query.page as string, 10) || 1,
					size: parseInt(req.query.size as string, 10) || 25,
					sort: req.query.sort as string || 'timestamp',
					direction: req.query.direction === 'desc' ? 'desc' : 'asc',
					query: _.omitBy({
						id: req.query.id as string,
						blockHash: req.query.blockHash as string || null,
						blockHeight: parseInt(req.query.height as string, 10) || null,
						channelName: req.query.channelName as string || null,
						chaincodeName: req.query.chaincodeName as string || null,
					}, _.isNil),
				};
				const blocks = await this.api.getTransactions(options);
				return res.send(blocks);
			} catch (error) {
				return next(error);
			}
		};
	}

	private getTransactionById(): Handler {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const id = req.params.id;
				const block = await this.api.getTransactionById(id);
				return res.send(block);
			} catch (error) {
				return next(error);
			}
		};
	}
}
