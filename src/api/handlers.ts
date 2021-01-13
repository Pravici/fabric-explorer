import { NextFunction, Response } from 'express';
import * as Nano from 'nano';
import { NanoRequest } from '../types';
import { stripMetadata } from './middleware';

export async function getRecentBlocks(req: NanoRequest, res: Response, next: NextFunction) {
	try {
		const q: Nano.MangoQuery = {
			selector: { channelName: req.query.channelName },
			limit: 25,
			sort: [{ height: 'desc' }],
			bookmark: req.query.bookmark as string,
		};
		const { docs, bookmark } = await req.blocks.find(q);
		res.send({ blocks: stripMetadata(docs), bookmark });
	} catch (error) {
		return next(error);
	}
}

export async function getByBlockId(req: NanoRequest, res: Response, next: NextFunction) {
	try {
		const block = await req.blocks.get(req.params.id);
		res.send(stripMetadata(block));
	} catch (error) {
		return next(error);
	}
}

export async function getBlockTransactions(req: NanoRequest, res: Response, next: NextFunction) {
	try {
		const q: Nano.MangoQuery = {
			selector: { blockHash: req.params.id },
			limit: 25,
			sort: [{ txTimestamp: 'asc' }],
			bookmark: req.query.bookmark as string,
		};
		const { docs, bookmark } = await req.transactions.find(q);
		res.send({ transactions: stripMetadata(docs), bookmark });
	} catch (error) {
		return next(error);
	}
}

export async function getRecentTransactions(req: NanoRequest, res: Response, next: NextFunction) {
	try {
		const q: Nano.MangoQuery = {
			selector: {
				channelName: req.query.channelName,
				chaincodeName: req.query.chaincodeName,
			},
			limit: 25,
			sort: [{ txTimestamp: 'desc' }],
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
		return next(error)
	}
}
