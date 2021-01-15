import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncatePipe' })
export class TruncatePipe implements PipeTransform {
	transform(value: string, limit = 8): string {
		value = value || '';
		if (limit && value.length > limit + 3) {
			value = value.substr(0, limit) + '...';
		}
		return value;
	}
}
