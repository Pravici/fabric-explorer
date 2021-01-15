import { NbAccessChecker } from '@nebular/security';
import { forkJoin, Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';

function normalize(permissions: string[] | string[][]): string[][] {
	let _permissions = permissions as string[][];
	if (!Array.isArray(_permissions[0])) {
		_permissions = [permissions as string[]];
	}
	return _permissions;
}

export function hasOne(accessChecker: NbAccessChecker, permissions: string[] | string[][]) {
	if (!permissions) {
		return of(true);
	}

	return forkJoin(
		normalize(permissions).map(([permission, resource]) => accessChecker.isGranted(permission, resource).pipe(take(1))))
		.pipe(
			map(results => {
				const grantedCount = results.filter(granted => !!granted).length;
				return grantedCount > 0;
			}),
		);
}

export function hasAll(accessChecker: NbAccessChecker, permissions: string[] | string[][]): Observable<boolean> {
	if (!permissions) {
		return of(true);
	}

	return forkJoin(
		normalize(permissions).map(([permission, resource]) => accessChecker.isGranted(permission, resource).pipe(take(1))))
		.pipe(
			map(results => {
				const failedCount = results.filter(granted => !granted).length;
				return failedCount === 0;
			}),
		);
}
