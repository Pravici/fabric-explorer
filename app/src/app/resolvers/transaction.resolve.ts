import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Transaction } from '../common';
import { APIService } from '../services/api.service';

@Injectable()
export class TransactionResolve implements Resolve<Transaction> {
	constructor(private api: APIService) { }
	resolve(route: ActivatedRouteSnapshot) {
		const id = route.paramMap.get('id');
		if (!id) {
			return null;
		}
		return this.api.getTransactionById(id).pipe(catchError(() => of(null)));
	}
}
