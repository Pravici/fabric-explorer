import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Block, Metadata, Transaction } from '../../common';
import { APIService } from '../../services/api.service';

@Component({
	selector: 'fabric-explorer-dashboard',
	templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {

	channels$: Observable<Metadata['channels']>;
	transactions$: Observable<Transaction[]>;
	blocks$: Observable<Block[]>;

	constructor(private api: APIService) { }

	public ngOnInit() {
		this.channels$ = this.api.getChannels();
		this.transactions$ = this.api.getTransactions('', { limit: 10 }).pipe(map(result => result.transactions));
		this.blocks$ = this.api.getBlocks('', { limit: 10 }).pipe(map(result => result.blocks));
	}
}
