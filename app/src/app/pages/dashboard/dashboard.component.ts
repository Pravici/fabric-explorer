import { Component, OnInit } from '@angular/core';
import { Block, Metadata, Transaction } from '../../common';
import { APIService } from '../../services/api.service';

@Component({
	selector: 'fabric-explorer-dashboard',
	templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
	channels: Metadata['channels'] = {};
	transactions: Transaction[] = [];
	blocks: Block[] = [];

	constructor(private api: APIService) { }

	public ngOnInit() {
		this.api.getChannels().subscribe(channels => {
			this.channels = channels;
		});

		this.api.getBlocks('', { limit: 10 }).subscribe(({ blocks, bookmark }) => {
			this.blocks = blocks;
		});

		this.api.getTransactions('', { limit: 10 }).subscribe(({ transactions }) => {
			this.transactions = transactions;
		});
	}
}
