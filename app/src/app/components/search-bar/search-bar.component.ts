import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface SearchOption {
	type: string;
	translateKey: string;
	queryParam?: string;
}

export interface SelectedOption {
	key: string;
	value: string;
}

@Component({
	selector: 'fabric-explorer-search-bar',
	templateUrl: './search-bar.component.html',
})
export class SearchBarComponent implements OnInit, OnDestroy {
	@Input() options: SearchOption[] = [];
	@Input() hideShowAll = false;
	@Output() search = new EventEmitter<Params>();

	simple = true;

	private unsubscribe$ = new Subject();
	private syncUpdate = false;
	private queryUpdate = false;

	formGroup: FormGroup;
	filtered = false;
	loading = false;

	constructor(
		private fb: FormBuilder,
		private route: ActivatedRoute,
		private router: Router,
	) { }

	public ngOnInit() {
		this.formGroup = this.fb.group({
			key: [this.options[0].type, [Validators.required]],
			value: ['', [Validators.required, Validators.minLength(1)]],
		});

		this.route.queryParamMap
			.pipe(takeUntil(this.unsubscribe$))
			.subscribe(queryParams => {
				// Skip updates from sync()
				if (this.syncUpdate) {
					this.syncUpdate = false;
					return;
				}

				let key, value;
				for (const option of this.options) {
					const queryValue = queryParams.get(option.queryParam);
					if (queryValue) {
						key = option.type;
						value = queryValue;
						break;
					}
				}

				this.formGroup.controls.key.setValue(key || this.options[0].type);
				this.formGroup.controls.value.setValue(value || '');

				this.queryUpdate = true;
				if (key && value) {
					this.submit();
				} else {
					this.reset();
				}
			});
	}

	public ngOnDestroy() {
		this.unsubscribe$.next();
		this.unsubscribe$.complete();
	}

	public reset() {
		this.filtered = false;
		this.formGroup.controls.value.setValue('');
		this.sync();
		this.search.emit(null);
	}

	public submit() {
		if (!this.formGroup.valid) {
			return;
		}

		const term = this.formGroup.controls.value.value.trim();
		this.formGroup.controls.value.setValue(term);
		this.filtered = true;
		this.sync();
		this.search.emit({ [this.formGroup.controls.key.value]: term });
	}

	private sync() {
		// Skip updates from queryParams.subscribe(...)
		if (this.queryUpdate) {
			this.queryUpdate = false;
			return;
		}
		this.syncUpdate = true;

		const key = this.formGroup.controls.key.value as string;
		const value = this.formGroup.controls.value.value as string;
		const queryParams = { ...this.route.snapshot.queryParams };

		this.options.forEach(option => {
			if (option.type === key) {
				queryParams[option.queryParam] = value;
			} else {
				delete queryParams[option.queryParam];
			}
		});
		this.router.navigate([], { relativeTo: this.route, replaceUrl: false, queryParams });
	}
}
