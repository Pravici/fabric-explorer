import { NbMenuItem } from '@nebular/theme';

export interface MenuItem extends NbMenuItem {
	translationKey: string;
	/** If an array, user must have all permissions */
	isGranted?: [string, string] | Array<[string, string]>;
}
