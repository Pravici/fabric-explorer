import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { Block, Metadata, Transaction } from '../common';

@Injectable({ providedIn: 'root' })
export class APIService {

	constructor(private http: HttpClient) { }

	public getChannels() {
		return this.http.get<Metadata['channels']>('/api/channels');
	}

	public getBlocks(bookmark = '', search: Params = {}) {
		if (bookmark) {
			search.bookmark = bookmark;
		}
		return this.http.get<{ bookmark: string, blocks: Block[] }>('/api/blocks', { params: search });
	}

	public getBlockById(id: string) {
		return this.http.get<Block>(`/api/blocks/${id}`);
	}

	public getBlockTransactions(blockId: string, bookmark?: string) {
		const params: Params = {};
		if (bookmark) {
			params.bookmark = bookmark;
		}
		return this.http.get<{ bookmark: string, transactions: Transaction[] }>(`/api/blocks/${blockId}/transactions`, { params });
	}

	public getTransactions(bookmark?: string, search: Params = {}) {
		if (bookmark) {
			search.bookmark = bookmark;
		}
		return this.http.get<{ bookmark: string, transactions: Transaction[] }>(`/api/transactions`, { params: search });
	}

	public getTransactionById(id: string) {
		return this.http.get<Transaction>(`/api/transactions/${id}`);
	}
}
