import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Request, Response, Router } from 'express';
import * as Nano from 'nano';
import * as handlers from './handlers';
import * as middleware from './middleware';
import * as path from 'path';

const pageRoutes = [
	'/',
	'/dashboard',
	'/blocks',
	'/blocks/:id/details',
	'/transactions',
	'/transactions/:id/details',
];

export function create(nano: Nano.ServerScope) {
	const api = Router();

	api.use('/channels', Router()
		.use(middleware.database(nano))
		.get('/', handlers.getChannels),
	);

	api.use('/transactions', Router()
		.use(middleware.database(nano))
		.get(['/', '/recent'], handlers.getTransactions)
		.get('/:id', handlers.getTransactionById),
	);

	api.use('/blocks', Router()
		.use(middleware.database(nano))
		.get(['/', '/recent'], handlers.getBlocks)
		.get('/:id', handlers.getByBlockId)
		.get('/:id/transactions', handlers.getBlockTransactions),
	);

	const app = express();
	app.get(pageRoutes, (req: Request, res: Response) => res.sendFile(path.join(__dirname, '../../static/index.html')));
	app.use(express.static('static'));
	app.use(bodyParser.json());

	app.use(['/api', '/'], api);
	app.use(middleware.errorHandler());

	return app;
}


