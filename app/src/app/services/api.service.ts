import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { Block, BlockQuery, BlockTransactionQuery, Channel, Transaction, TransactionQuery } from '../common';

@Injectable({ providedIn: 'root' })
export class APIService {

	constructor(private http: HttpClient) { }

	public getChannels() {
		return this.http.get<Channel[]>('/api/channels');
	}

	public getBlocks(search: Partial<BlockQuery> = {}) {
		return this.http.get<Block[]>('/api/blocks', { params: this.flatten(search) });
	}

	public getBlockById(id: string) {
		return this.http.get<Block>(`/api/blocks/${id}`);
	}

	public getBlockTransactions(blockId: string) {
		const params: Params = {};
		return this.http.get<Transaction[]>(`/api/blocks/${blockId}/transactions`, { params });
	}

	public getTransactions(search: Partial<TransactionQuery> = {}) {
		return this.http.get<Transaction[]>(`/api/transactions`, { params: this.flatten(search) });
	}

	public getTransactionById(id: string) {
		return this.http.get<Transaction>(`/api/transactions/${id}`);
	}

	private flatten(options: Partial<BlockQuery & BlockTransactionQuery & TransactionQuery>): Params {
		const params = { ...options, ...options.query };
		delete params.query;
		return params;
	}
}
