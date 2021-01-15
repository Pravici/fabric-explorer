import { Component, Input } from '@angular/core';
import { Transaction } from '../../common';

@Component({
	selector: 'fabric-explorer-transaction-list',
	templateUrl: './transaction-list.component.html',
})
export class TransactionListComponent {
	@Input() transactions: Transaction[] = [];
	@Input() simple = false;
}
