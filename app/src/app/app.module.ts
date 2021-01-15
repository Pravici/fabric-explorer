import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NbDatepickerModule, NbDialogModule, NbMenuModule, NbSidebarModule, NbToastrModule, NbWindowModule } from '@nebular/theme';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './auth.interceptor';
import { ComponentsModule } from './components/components.module';
import { CoreModule } from './core/core.module';
import { BlockDetailComponent } from './pages/block-detail/block-detail.component';
import { BlocksComponent } from './pages/blocks/blocks.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TransactionDetailComponent } from './pages/transaction-detail/transaction-detail.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { TruncatePipe } from './pipes/truncate.pipe';
import { BlockResolve } from './resolvers/block.resolve';
import { TransactionResolve } from './resolvers/transaction.resolve';
import { ThemeModule } from './theme/theme.module';

export const routes: Routes = [
	{
		path: 'dashboard',
		component: DashboardComponent,
	},
	{
		path: 'blocks',
		component: BlocksComponent,
	},
	{
		path: 'blocks/:id/details',
		component: BlockDetailComponent,
		resolve: { block: BlockResolve },
	},
	{
		path: 'transactions',
		component: TransactionsComponent,
	},
	{
		path: 'transactions/:id/details',
		component: TransactionDetailComponent,
		resolve: { transaction: TransactionResolve },
	},
	{
		path: '',
		redirectTo: 'dashboard',
		pathMatch: 'full',
	},
	{
		path: '**',
		redirectTo: '/dashboard',
	},
];

const config: ExtraOptions = {
	useHash: false,
};

export function createTranslateLoader(http: HttpClient) {
	return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
	declarations: [
		AppComponent,
		DashboardComponent,
		BlocksComponent,
		BlockDetailComponent,
		TransactionsComponent,
		TransactionDetailComponent,
		TruncatePipe,
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		HttpClientModule,
		ReactiveFormsModule,

		TranslateModule.forRoot({
			useDefaultLang: false,
			loader: {
				provide: TranslateLoader,
				useFactory: (createTranslateLoader),
				deps: [HttpClient],
			},
		}),
		RouterModule.forRoot(routes, config),
		ThemeModule.forRoot(),
		ComponentsModule,

		NbDatepickerModule.forRoot(),
		NbSidebarModule.forRoot(),
		NbMenuModule.forRoot(),
		NbDatepickerModule.forRoot(),
		NbDialogModule.forRoot(),
		NbWindowModule.forRoot(),
		NbToastrModule.forRoot({ duration: 10000, preventDuplicates: true }),
		CoreModule.forRoot(),
	],
	entryComponents: [],
	bootstrap: [AppComponent],
	providers: [
		{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
		BlockResolve,
		TransactionResolve,
	],
})
export class AppModule {
}
