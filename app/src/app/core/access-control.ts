import { NbAccessControl } from '@nebular/security';

export const accessControl: NbAccessControl = {
	default: {
		menu: [
			'dashboard',
			'blocks',
			'transactions',
		],
	},
};
