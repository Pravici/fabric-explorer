import { Component, Input } from '@angular/core';

@Component({
	selector: 'fabric-explorer-one-column-layout',
	styleUrls: ['./one-column.layout.scss'],
	templateUrl: './one-column.layout.html',
})
export class OneColumnLayoutComponent {
	@Input() visibleSidebar = true;
}
