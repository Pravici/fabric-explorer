import { Component, OnInit } from '@angular/core';
import { Block, Channel, Transaction } from '../../common';
import { APIService } from '../../services/api.service';

@Component({
	selector: 'fabric-explorer-dashboard',
	templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
	channels: Channel[] = [];
	transactions: Transaction[] = [];
	blocks: Block[] = [];

	constructor(private api: APIService) { }

	public ngOnInit() {
		this.api.getChannels().subscribe(channels => {
			this.channels = channels;
		});

		this.api.getBlocks({ size: 10 }).subscribe(blocks => {
			this.blocks = blocks;
		});

		this.api.getTransactions({ size: 10 }).subscribe(transactions => {
			this.transactions = transactions;
		});
	}
}
