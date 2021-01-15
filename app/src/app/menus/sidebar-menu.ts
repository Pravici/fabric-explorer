import { MenuItem } from './menu-item';

export const sidebarMenu: MenuItem[] = [
	// {
	// 	title: '',
	// 	translationKey: 'MANAGE',
	// 	group: true,
	// 	isGranted: ['menu', 'explorer'],
	// },
	{
		title: '',
		translationKey: 'DASHBOARD',
		icon: 'tachometer-alt',
		link: '/dashboard',
		isGranted: ['menu', 'dashboard'],
	},
	{
		title: '',
		translationKey: 'BLOCKS',
		icon: 'cubes',
		link: '/blocks',
		isGranted: ['menu', 'blocks'],
	},
	{
		title: '',
		translationKey: 'TRANSACTIONS',
		icon: 'receipt',
		link: '/transactions',
		isGranted: ['menu', 'transactions'],
	},
];
