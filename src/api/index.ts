import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Router } from 'express';
import * as middleware from './middleware';
import * as handlers from './handlers';
import * as Nano from 'nano';

export function create(nano: Nano.ServerScope) {
	const app = express();
	app.use(bodyParser.json());

	app.use('/transactions', Router()
		.use(middleware.database(nano))
		.get(['/', '/recent'], handlers.getRecentTransactions)
		.get('/:id', handlers.getTransactionById)
	);

	app.use('/blocks', Router()
		.use(middleware.database(nano))
		.get(['/', '/recent'], handlers.getRecentBlocks)
		.get('/:id', handlers.getByBlockId)
		.get('/:id/transactions', handlers.getRecentTransactions)
	);

	app.use(middleware.errorHandler());

	return app;
}


