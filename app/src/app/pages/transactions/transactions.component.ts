import { Component } from '@angular/core';
import { Params } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Transaction } from '../../common';
import { SearchOption } from '../../components/search-bar/search-bar.component';
import { APIService } from '../../services/api.service';

@Component({
	selector: 'fabric-explorer-transactions',
	templateUrl: './transactions.component.html',
})
export class TransactionsComponent {
	loading = false;
	bookmark = '';
	transactions: Transaction[] = [];
	searchOptions: SearchOption[] = [
		{ type: 'id', translateKey: 'HASH', queryParam: 'id' },
		{ type: 'channelName', translateKey: 'CHANNEL', queryParam: 'channelName' },
		{ type: 'chaincodeName', translateKey: 'CHAINCODE', queryParam: 'chaincodeName' },
	];

	constructor(private api: APIService) { }

	public search(params: Params) {
		this.bookmark = '';
		this.loadTransactions(params);
	}

	loadTransactions(params: Params = {}) {
		this.loading = true;
		if (!this.bookmark) {
			this.transactions = [];
		}
		this.api.getTransactions(this.bookmark, params)
			.pipe(finalize(() => this.loading = false))
			.subscribe(({ bookmark, transactions }) => {
				this.transactions.push(...transactions);
				this.bookmark = bookmark;
			});
	}
}
