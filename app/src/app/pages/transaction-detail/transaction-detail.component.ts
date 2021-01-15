import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { Transaction } from '../../common';

@Component({
	selector: 'fabric-explorer-transaction-detail',
	templateUrl: './transaction-detail.component.html',
})
export class TransactionDetailComponent implements OnInit {
	transaction: Transaction;

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private notificationService: NbToastrService,
	) { }

	public ngOnInit() {
		this.transaction = this.route.snapshot.data.transaction;
		if (!this.transaction) {
			this.notificationService.warning('Transaction not found');
			this.router.navigate(['transactions']);
		}
	}
}
