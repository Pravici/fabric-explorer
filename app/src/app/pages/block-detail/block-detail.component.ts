import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { Block, Transaction } from '../../common';
import { APIService } from '../../services/api.service';

@Component({
	selector: 'fabric-explorer-block-detail',
	templateUrl: './block-detail.component.html',
})
export class BlockDetailComponent implements OnInit {
	block: Block;
	transactions: Transaction[] = [];

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private notificationService: NbToastrService,
		private api: APIService,
	) { }

	public ngOnInit() {
		this.block = this.route.snapshot.data.block;
		if (!this.block) {
			this.notificationService.warning('Block not found');
			this.router.navigate(['blocks']);
		}

		this.api.getBlockTransactions(this.block.id).subscribe(transactions => {
			this.transactions = transactions;
		});
	}
}
