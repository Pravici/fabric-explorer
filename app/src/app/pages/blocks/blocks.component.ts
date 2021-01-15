import { Component } from '@angular/core';
import { Params } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Block } from '../../common';
import { SearchOption } from '../../components/search-bar/search-bar.component';
import { APIService } from '../../services/api.service';

@Component({
	selector: 'fabric-explorer-blocks',
	templateUrl: './blocks.component.html',
})
export class BlocksComponent {
	loading = false;
	bookmark = '';
	blocks: Block[] = [];
	searchOptions: SearchOption[] = [
		{ type: 'id', translateKey: 'HASH', queryParam: 'id' },
		{ type: 'height', translateKey: 'HEIGHT', queryParam: 'height' },
		{ type: 'channelName', translateKey: 'CHANNEL', queryParam: 'channelName' },
		{ type: 'chaincodeName', translateKey: 'CHAINCODE', queryParam: 'chaincodeName' },
	];

	constructor(private api: APIService) { }

	public search(params: Params) {
		this.bookmark = '';
		this.loadBlocks(params);
	}

	loadBlocks(params: Params = {}) {
		this.loading = true;
		if (!this.bookmark) {
			this.blocks = [];
		}
		this.api.getBlocks(this.bookmark, params)
			.pipe(finalize(() => this.loading = false))
			.subscribe(({ bookmark, blocks }) => {
				this.blocks.push(...blocks);
				this.bookmark = bookmark;
			});
	}
}
