import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NbAccessChecker } from '@nebular/security';
import { NbIconLibraries } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { from } from 'rxjs';
import { filter, map, mergeMap, skip, tap } from 'rxjs/operators';
import * as menus from './menus';
import { hasAll, sidebarMenu, MenuItem } from './menus';

@Component({
	selector: 'fabric-explorer-app',
	templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
	menu: MenuItem[] = [];

	constructor(
		private iconLibraries: NbIconLibraries,
		private route: ActivatedRoute,
		private router: Router,
		private translateService: TranslateService,
		private titleService: Title,
		private accessChecker: NbAccessChecker,
	) { }

	public ngOnInit() {
		this.iconLibraries.registerFontPack('far', { packClass: 'far', iconClassPrefix: 'fa' });
		this.iconLibraries.registerFontPack('fas', { packClass: 'fas', iconClassPrefix: 'fa' });
		this.iconLibraries.setDefaultPack('fas');

		this.route.queryParams.subscribe(params => {
			if (params.lang) {
				this.translateService.use(params.lang);
			}
		});

		this.router.events
			.pipe(
				filter<NavigationEnd>(event => event instanceof NavigationEnd),
				tap(() => {
					let route = this.route;
					while (route.firstChild) {
						route = route.firstChild;
					}
					if (route && route.snapshot && route.snapshot.data && route.snapshot.data.title) {
						this.titleService.setTitle(`Explorer | ${route.snapshot.data.title}`);
					}
				}),
			)
			.subscribe();

		this.refreshMenu();

		this.translateService.use('en');
		menus.translate(this.translateService);

		this.translateService.onLangChange
			.subscribe(() => menus.translate(this.translateService));

		this.translateService.onLangChange
			.pipe(skip(1))
			.subscribe(event => {
				this.router.navigate([], {
					queryParams: { lang: event.lang },
					replaceUrl: true,
				});
			});
	}

	private refreshMenu() {
		const menu: MenuItem[] = [];

		from(sidebarMenu)
			.pipe(
				mergeMap(item => {
					return hasAll(this.accessChecker, item.isGranted)
						.pipe(map(granted => ({ granted, item })));
				}),
				filter(item => item.granted),
			)
			.subscribe(
				result => (menu.push(result.item)),
				() => { },
				() => (this.menu = menu),
			);
	}
}
