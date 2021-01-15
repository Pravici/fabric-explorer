import { Component, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NbDialogRef, NbDialogService, NbMenuItem, NbMenuService, NbSidebarService, NbThemeService } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { LANGUAGES, THEMES } from '../../constants';

@Component({
	selector: 'fabric-explorer-header',
	styleUrls: ['./header.component.scss'],
	templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {
	@ViewChild('themeSwitcher', { static: false }) themeSwitcher: TemplateRef<any>;
	@ViewChild('languageSwitcher', { static: false }) languageSwitcher: TemplateRef<any>;
	@ViewChild('keyboardShortcuts', { static: false }) keyboardShortcuts: TemplateRef<any>;
	keyboardShortcutsRef: NbDialogRef<any>;

	private unsubscribe$: Subject<void> = new Subject();

	envLabel = '';

	userMenu: NbMenuItem[] = [];

	selectedTheme: string = null;
	currentTheme: string = null;
	themes = THEMES;

	selectedLanguage: string = null;
	currentLanguage: string = null;
	languages = LANGUAGES;

	constructor(
		private dialogService: NbDialogService,
		private sidebarService: NbSidebarService,
		private menuService: NbMenuService,
		private themeService: NbThemeService,
		private translateService: TranslateService,
		private router: Router,
	) { }

	public ngOnInit() {
		this.envLabel = this.getEnvLabel();

		this.menuService.onItemClick()
			.pipe(takeUntil(this.unsubscribe$))
			.subscribe(({ item }) => {
				if (item && item.data) {
					switch (item.data.name) {
						case 'switch-theme':
							this.openThemeChooser();
							break;
						case 'switch-language':
							this.openLanguageChooser();
							break;
					}
				}
			});

		this.currentTheme = this.themeService.currentTheme;
		this.themeService.onThemeChange()
			.pipe(
				takeUntil(this.unsubscribe$),
				map(({ name }) => name),
			)
			.subscribe(themeName => (this.currentTheme = themeName));

		this.currentLanguage = this.translateService.currentLang;
		this.translateService.onLangChange
			.pipe(takeUntil(this.unsubscribe$))
			.subscribe(event => (this.currentLanguage = event.lang));
	}

	public ngOnDestroy() {
		this.unsubscribe$.next();
		this.unsubscribe$.complete();
	}

	@HostListener('document:keydown', ['$event'])
	public onKeydown(event: KeyboardEvent) {
		const target = event.target as Element;
		switch (target.tagName.toLowerCase()) {
			case 'textarea':
			case 'input':
			case 'select':
			case 'button':
				return;
		}

		if (event.shiftKey && event.key === '?') {
			if (this.keyboardShortcutsRef) {
				this.keyboardShortcutsRef.close();
				this.keyboardShortcutsRef = null;
			}
			this.keyboardShortcutsRef = this.dialogService.open(this.keyboardShortcuts);
		} else if (event.altKey && event.key === 't') {
			this.toggleTheme();
		} else if (event.altKey && event.key === 'l') {
			this.toggleLanguage();
		} else if (event.altKey && event.shiftKey && event.key === 'X') {
			this.router.navigate(['/auth/logout']);
		}
	}

	public toggleSidebar(): boolean {
		this.sidebarService.toggle(true, 'menu-sidebar');
		return false;
	}

	public openLanguageChooser() {
		this.selectedLanguage = this.currentLanguage;
		const _currentLanguage = this.currentLanguage;
		this.dialogService.open(this.languageSwitcher).onClose.subscribe(language => {
			if (!language) {
				this.translateService.use(_currentLanguage);
			}
		});
	}

	public toggleLanguage() {
		const index = this.languages.map(({ value }) => value).indexOf(this.currentLanguage);
		const next = this.languages[(index + 1) % this.languages.length];
		this.changeLanguage(next.value);
	}

	public changeLanguage(language: string) {
		this.translateService.use(language);
	}

	public openThemeChooser() {
		this.selectedTheme = this.currentTheme;
		const _currentTheme = this.currentTheme;
		this.dialogService.open(this.themeSwitcher).onClose.subscribe(themeName => {
			if (!themeName) {
				this.changeTheme(_currentTheme);
			}
		});
	}

	public toggleTheme() {
		const index = this.themes.map(({ value }) => value).indexOf(this.currentTheme);
		const next = this.themes[(index + 1) % this.themes.length];
		this.changeTheme(next.value);
	}

	public changeTheme(themeName: string) {
		this.themeService.changeTheme(themeName);
	}

	private getEnvLabel() {
		let envLabel = window.location.hostname.split('.')[0].toUpperCase();
		if (envLabel === 'LOCALHOST') {
			envLabel = 'LOCAL';
		}
		if (envLabel === 'TLP') {
			envLabel = '';
		}
		return envLabel;
	}
}
