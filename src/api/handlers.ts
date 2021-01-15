import { NextFunction, Request, Response } from 'express';
import * as Nano from 'nano';
import { Block, Metadata, METADATA_DOC, State, Transaction } from '../types';
import { stripMetadata } from './middleware';
import * as _ from 'lodash';

export interface NanoRequest extends Request {
	nano: Nano.ServerScope;
	transactions: Nano.DocumentScope<Transaction>;
	blocks: Nano.DocumentScope<Block>;
	metadata: Nano.DocumentScope<Metadata>;
	state: Nano.DocumentScope<State>;
}

export async function getChannels(req: NanoRequest, res: Response, next: NextFunction) {
	try {
		const doc = await req.metadata.get(METADATA_DOC);
		return res.send(doc.channels);
	} catch (error) {
		return next(error);
	}
}

export async function getBlocks(req: NanoRequest, res: Response, next: NextFunction) {
	try {
		const limit = req.query.limit as string;
		const q: Nano.MangoQuery = {
			selector: _.omitBy({
				id: req.query.id,
				height: parseInt(req.query.height as string, 10) || null,
				chaincodeName: req.query.chaincodeName,
				channelName: req.query.channelName,
			}, _.isNil),
			limit: parseInt(limit, 10) || 25,
			sort: [{ timestamp: 'desc' }],
			bookmark: req.query.bookmark as string,
		};
		console.log(q);
		const { docs, bookmark } = await req.blocks.find(q);
		return res.send({ blocks: stripMetadata(docs), bookmark });
	} catch (error) {
		return next(error);
	}
}

export async function getByBlockId(req: NanoRequest, res: Response, next: NextFunction) {
	try {
		const block = await req.blocks.get(req.params.id);
		return res.send(stripMetadata(block));
	} catch (error) {
		return next(error);
	}
}

export async function getBlockTransactions(req: NanoRequest, res: Response, next: NextFunction) {
	try {
		const q: Nano.MangoQuery = {
			selector: { blockHash: req.params.id },
			limit: 25,
			sort: [{ timestamp: 'asc' }],
			bookmark: req.query.bookmark as string,
		};
		const { docs, bookmark } = await req.transactions.find(q);
		return res.send({ transactions: stripMetadata(docs), bookmark });
	} catch (error) {
		return next(error);
	}
}

export async function getTransactions(req: NanoRequest, res: Response, next: NextFunction) {
	try {
		const limit = req.query.limit as string;
		const q: Nano.MangoQuery = {
			selector: _.omitBy({
				id: req.query.id,
				blockHash: req.query.blockHash,
				blockHeight: parseInt(req.query.blockHeight as string, 10) || null,
				chaincodeName: req.query.chaincodeName,
				channelName: req.query.channelName,
			}, _.isNil),
			limit: limit ? parseInt(limit, 10) : 25,
			sort: [{ timestamp: 'desc' }],
			bookmark: req.query.bookmark as string,
		};
		const { docs, bookmark } = await req.transactions.find(q);
		return res.send({ transactions: stripMetadata(docs), bookmark });
	} catch (error) {
		return next(error);
	}
}

export async function getTransactionById(req: NanoRequest, res: Response, next: NextFunction) {
	try {
		return res.send(stripMetadata(await req.transactions.get(req.params.id)));
	} catch (error) {
		return next(error);
	}
}
