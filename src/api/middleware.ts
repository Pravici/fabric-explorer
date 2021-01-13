import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import * as Nano from 'nano';
import { Block, DatabaseNames, NanoRequest, Transaction } from '../types';

export function errorHandler(): express.ErrorRequestHandler {
	return function (error: any, req: Request, res: Response, next: NextFunction) {
		console.log(error);
		res.status(error.statusCode || 500).send({ error: true, message: error.message || error });
	};
}

export function database(nano: Nano.ServerScope): express.RequestHandler {
	return function (req: NanoRequest, res: Response, next: NextFunction) {
		req.nano = nano;
		req.transactions = nano.use<Transaction>(DatabaseNames.TRANSACTIONS);
		req.blocks = nano.use<Block>(DatabaseNames.BLOCKS);
		next();
	}
}

export function stripMetadata(docs: Nano.MaybeDocument | Nano.MaybeDocument[]) {
	(Array.isArray(docs) ? docs : [docs]).map(doc => {
		delete doc._id;
		delete doc._rev;
	});
	return docs;
}
