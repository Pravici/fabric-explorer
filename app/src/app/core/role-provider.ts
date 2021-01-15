import { NbRoleProvider } from '@nebular/security';
import { of } from 'rxjs';

export class RoleProvider extends NbRoleProvider {
	constructor() {
		super();
	}

	getRole() {
		return of(['default']);
	}
}
