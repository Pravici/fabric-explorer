import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Transaction, TransactionQuery } from '../../common';
import { SearchOption } from '../../components/search-bar/search-bar.component';
import { APIService } from '../../services/api.service';

@Component({
	selector: 'fabric-explorer-transactions',
	templateUrl: './transactions.component.html',
})
export class TransactionsComponent {
	private query: TransactionQuery['query'] = {};

	loading = false;
	page = 1;
	lastPage = false;
	pageSize = 25;
	transactions: Transaction[] = [];

	searchOptions: SearchOption[] = [
		{ type: 'id', translateKey: 'HASH', queryParam: 'id' },
		{ type: 'channelName', translateKey: 'CHANNEL', queryParam: 'channelName' },
		{ type: 'chaincodeName', translateKey: 'CHAINCODE', queryParam: 'chaincodeName' },
	];

	constructor(private api: APIService) { }

	public search(query: TransactionQuery['query']) {
		this.query = query || {};
		this.page = 1;
		this.transactions = [];
		this.lastPage = false;
		this._search();
	}

	public nextPage() {
		this.page += 1;

		this._search();
	}

	private _search() {
		this.loading = true;
		this.api.getTransactions({ ...this.query, page: this.page, size: this.pageSize })
			.pipe(finalize(() => this.loading = false))
			.subscribe(transactions => {
				this.lastPage = transactions.length < this.pageSize;
				this.transactions.push(...transactions);
			});
	}
}
