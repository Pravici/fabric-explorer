import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TruncatePipe } from '../pipes/truncate.pipe';
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

const pipes = [
	TruncatePipe,
];

@NgModule({
	imports: [
		RouterModule,
		FormsModule,
		ReactiveFormsModule,
		ThemeModule,
		TranslateModule,
	],
	entryComponents: [],
	declarations: [...components, ...pipes],
	exports: [...components, ...pipes, TranslateModule],
})
export class ComponentsModule { }
