import { Component, Input } from '@angular/core';
import { Block } from '../../common';

@Component({
	selector: 'fabric-explorer-block-list',
	templateUrl: './block-list.component.html',
})
export class BlockListComponent {
	@Input() blocks: Block[] = [];
	@Input() simple = false;
}
