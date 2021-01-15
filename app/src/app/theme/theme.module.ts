import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	NbActionsModule,
	NbLayoutModule,
	NbBadgeModule,
	NbMenuModule,
	NbSearchModule,
	NbSidebarModule,
	NbAccordionModule,
	NbUserModule,
	NbContextMenuModule,
	NbButtonModule,
	NbSelectModule,
	NbIconModule,
	NbThemeModule,
	NbCardModule,
	NbCheckboxModule,
	NbListModule,
	NbInputModule,
	NbAlertModule,
	NbDatepickerModule,
	NbStepperModule,
	NbSpinnerModule,
	NbRadioModule,
	NbTooltipModule,
	NbToggleModule,
	NbRouteTabsetModule,
	NbTabsetModule,
} from '@nebular/theme';
import { NbSecurityModule } from '@nebular/security';
import { DEFAULT_THEME } from './theme.default';
import { COSMIC_THEME } from './theme.cosmic';
import { CORPORATE_THEME } from './theme.corporate';
import { DARK_THEME } from './theme.dark';
import { RouterModule } from '@angular/router';

const NB_MODULES = [
	NbDatepickerModule,
	NbCardModule,
	NbLayoutModule,
	NbMenuModule,
	NbUserModule,
	NbActionsModule,
	NbAlertModule,
	NbInputModule,
	NbRadioModule,
	NbSearchModule,
	NbSidebarModule,
	NbContextMenuModule,
	NbSecurityModule,
	NbSpinnerModule,
	NbButtonModule,
	NbSelectModule,
	NbStepperModule,
	NbListModule,
	NbIconModule,
	NbCheckboxModule,
	NbTooltipModule,
	NbBadgeModule,
	NbAccordionModule,
	NbToggleModule,
	NbRouteTabsetModule,
	NbTabsetModule,
];

@NgModule({
	imports: [CommonModule, RouterModule, ...NB_MODULES],
	exports: [CommonModule, ...NB_MODULES],
	declarations: [],
})
export class ThemeModule {
	static forRoot(): ModuleWithProviders {
		return <ModuleWithProviders>{
			ngModule: ThemeModule,
			providers: [
				...NbThemeModule.forRoot(
					{
						name: DEFAULT_THEME.name,
					},
					[DEFAULT_THEME, COSMIC_THEME, CORPORATE_THEME, DARK_THEME],
				).providers,
			],
		};
	}
}
