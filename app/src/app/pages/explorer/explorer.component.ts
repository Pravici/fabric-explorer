import { Component, OnInit } from '@angular/core';
import { Params } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { Block, Channel, Transaction } from '../../common';
import { SearchOption } from '../../components/search-bar/search-bar.component';
import { APIService } from '../../services/api.service';

@Component({
	selector: 'fabric-explorer-explorer',
	templateUrl: './explorer.component.html',
})
export class ExplorerComponent implements OnInit {
	channels: Channel[] = [];
	currentChannel: string = null;
	blocks: Block[] = [];
	currentBlock: Block = null;
	transactions: Transaction[] = [];
	currentTransaction: Transaction = null;
	hash = '';
	searchOptions: SearchOption[] = [
		{ type: 'hash', translateKey: 'HASH', queryParam: 'q' },
	];

	constructor(
		private notificationService: NbToastrService,
		private api: APIService,
	) { }

	public search(options: Params) {
		const { hash } = options || {} as Params;
		this.hash = hash || null;
		if (!hash) {
			if (this.channels.length > 0) {
				this.selectChannel(this.channels[0].name);
			}
			return;
		}

		this.api.search(hash)
			.subscribe({
				next: ({ block, transaction, channel }) => {
					if (channel) {
						this.currentChannel = null;
						this.blocks = [];
						this.currentBlock = null;
						this.transactions = [];
						this.currentTransaction = null;
					}

					if (block) {
						this.currentChannel = block.channelName;
						this.blocks = [block];
						this.currentBlock = null;
						this.transactions = [];
						this.currentTransaction = null;
					}

					if (transaction) {
						this.currentChannel = transaction.channelName;
						this.blocks = [];
						this.api.getBlockById(transaction.blockHash).subscribe({
							next: _block => {
								this.blocks = [_block];
								this.currentBlock = _block;
							},
							error: () => { },
						});
						this.transactions = [transaction];
						this.currentTransaction = null;
					}
				},
				error: response => {
					this.notificationService.danger('', response.error.message || response.message, { hasIcon: false });
				},
			});
	}

	public ngOnInit() {
		this.api.getChannels().subscribe(channels => {
			this.channels = channels;
			if (this.channels && this.channels.length > 0)
				this.selectChannel(this.channels[0].name);
		});
	}

	public selectChannel(channelName: string) {
		if (!channelName || this.channels.length === 0) {
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

		const query: Params = {
			channelName,
			sort: 'height',
			direction: 'desc',
			limit: 10,
		};

		this.api.getBlocks({ query }).subscribe(blocks => {
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

		const query = {
			channelName: this.currentChannel,
			blockHash: this.currentBlock.id,
			limit: 10,
		};

		this.api.getTransactions({ query }).subscribe(transactions => {
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
