export * from './access-helpers';
export * from './menu-item';
export * from './sidebar-menu';

import { TranslateService } from '@ngx-translate/core';
import { sidebarMenu } from './sidebar-menu';

export const translate = (translateService: TranslateService) => {
	[sidebarMenu].forEach(items => {
		items.forEach(item => {
			item.title = translateService.instant(item.translationKey);
		});
	});
};
