import { NbAccessControl } from '@nebular/security';

export const accessControl: NbAccessControl = {
	default: {
		menu: [
			'dashboard',
			'explorer',
			'blocks',
			'transactions',
		],
	},
};
