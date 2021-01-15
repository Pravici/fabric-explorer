import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxQRCodeModule } from 'ngx-qrcode2';
import { ThemeModule } from '../theme/theme.module';
import { BlockListComponent } from './block-list/block-list.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { OneColumnLayoutComponent } from './one-column/one-column.layout';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { ToggleReadonlyComponent } from './toggle-readonly/toggle-readonly.component';
import { TransactionListComponent } from './transaction-list/transaction-list.component';

const components = [
	BlockListComponent,
	FooterComponent,
	HeaderComponent,
	OneColumnLayoutComponent,
	SearchBarComponent,
	ToggleReadonlyComponent,
	TransactionListComponent,
];

@NgModule({
	imports: [
		NgxQRCodeModule,
		RouterModule,
		FormsModule,
		ReactiveFormsModule,
		ThemeModule,
		TranslateModule,
	],
	entryComponents: [],
	declarations: [...components],
	exports: [...components, TranslateModule],
})
export class ComponentsModule { }
