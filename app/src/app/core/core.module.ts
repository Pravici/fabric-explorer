import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { NbAuthModule, NbDummyAuthStrategy } from '@nebular/auth';
import { NbRoleProvider, NbSecurityModule } from '@nebular/security';
import { ComponentsModule } from '../components/components.module';
import { accessControl } from './access-control';
import { throwIfAlreadyLoaded } from './module-import-guard';
import { RoleProvider } from './role-provider';

const socialLinks = [
	{
		url: 'https://github.com/pravici',
		target: '_blank',
		icon: 'github',
	},
	{
		url: 'https://www.linkedin.com/company/pravici/',
		target: '_blank',
		icon: 'linkedin',
	},
	{
		url: 'https://twitter.com/pravici',
		target: '_blank',
		icon: 'twitter',
	},
];

const forms = {
	login: { socialLinks },
	register: { socialLinks },
};

const strategies = [
	NbDummyAuthStrategy.setup({
		name: 'email',
		delay: 3000,
	}),
];

const NB_CORE_PROVIDERS = [
	...NbAuthModule.forRoot({ strategies, forms }).providers,
	...NbSecurityModule.forRoot({ accessControl }).providers,
	{ provide: NbRoleProvider, useClass: RoleProvider },
];

@NgModule({
	imports: [
		CommonModule,
		ComponentsModule,
	],
	exports: [
		NbAuthModule,
	],
	declarations: [],
	providers: [],
})
export class CoreModule {
	constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
		throwIfAlreadyLoaded(parentModule, 'CoreModule');
	}

	static forRoot(): ModuleWithProviders {
		return <ModuleWithProviders>{
			ngModule: CoreModule,
			providers: [
				...NB_CORE_PROVIDERS,
			],
		};
	}
}
