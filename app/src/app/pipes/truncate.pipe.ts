import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncatePipe' })
export class TruncatePipe implements PipeTransform {
	transform(value: string, limit = 8, endLimit = 0): string {
		value = value || '';
		if (limit && value.length > limit + 3) {
			value = value.substr(0, limit) + '...' + value.substr(value.length - endLimit, endLimit);
		}
		return value;
	}
}
