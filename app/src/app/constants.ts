export interface SelectOption {
	value: string;
	name: string;
}

export const THEMES: SelectOption[] = [
	{ value: 'default', name: 'Light' },
	{ value: 'dark', name: 'Dark' },
	{ value: 'cosmic', name: 'Cosmic' },
	{ value: 'corporate', name: 'Corporate' },
];

export const LANGUAGES: SelectOption[] = [
	{ value: 'en', name: 'English' },
];
