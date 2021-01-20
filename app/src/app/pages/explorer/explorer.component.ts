import { Component, OnInit } from '@angular/core';
import { Block, Metadata, Transaction } from '../../common';
import { APIService } from '../../services/api.service';

@Component({
	selector: 'fabric-explorer-explorer',
	templateUrl: './explorer.component.html',
})
export class ExplorerComponent implements OnInit {

	channels: Metadata['channels'] = {};

	currentChannel: string = null;
	blocks: Block[] = [];
	currentBlock: Block = null;
	transactions: Transaction[] = [];
	currentTransaction: Transaction = null;

	constructor(private api: APIService) { }

	public ngOnInit() {
		this.api.getChannels().subscribe(channels => {
			this.channels = channels;
			this.selectChannel(Object.keys(this.channels)[0]);
		});

	}

	public selectChannel(channelName: string) {
		if (!channelName) {
			return;
		}

		this.currentChannel = this.currentChannel === channelName ? null : channelName;
		this.blocks = [];
		this.currentBlock = null;
		this.transactions = [];
		this.currentTransaction = null;

		if (!this.currentChannel) {
			return;
		}

		const search = {
			channelName: this.currentChannel,
			limit: 10,
		};

		this.api.getBlocks('', search).subscribe(({ blocks, bookmark }) => {
			this.blocks = blocks;
			if (blocks.length > 0) {
				this.selectBlock(blocks[0]);
			}
		});
	}

	public selectBlock(block: Block) {
		if (!block) {
			return;
		}


		this.currentBlock = this.currentBlock === block ? null : block;
		this.transactions = [];
		this.currentTransaction = null;

		if (!this.currentBlock) {
			return;
		}

		const search = {
			channelName: this.currentChannel,
			blockHash: this.currentBlock.id,
			limit: 10,
		};

		this.api.getTransactions('', search).subscribe(({ transactions, bookmark }) => {
			this.transactions = transactions;
		});
	}

	public selectTransaction(transaction: Transaction) {
		if (!transaction) {
			return;
		}
		this.currentTransaction = this.currentTransaction === transaction ? null : transaction;
	}
}
