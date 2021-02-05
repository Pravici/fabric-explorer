import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Block, BlockQuery } from '../../common';
import { SearchOption } from '../../components/search-bar/search-bar.component';
import { APIService } from '../../services/api.service';

@Component({
	selector: 'fabric-explorer-blocks',
	templateUrl: './blocks.component.html',
})
export class BlocksComponent {
	private query: BlockQuery['query'] = {};

	loading = false;
	page = 1;
	lastPage = false;
	pageSize = 25;
	blocks: Block[] = [];

	searchOptions: SearchOption[] = [
		{ type: 'id', translateKey: 'HASH', queryParam: 'id' },
		{ type: 'height', translateKey: 'HEIGHT', queryParam: 'height' },
		{ type: 'channelName', translateKey: 'CHANNEL', queryParam: 'channelName' },
		{ type: 'chaincodeName', translateKey: 'CHAINCODE', queryParam: 'chaincodeName' },
	];

	constructor(private api: APIService) { }

	public search(query: BlockQuery['query']) {
		this.query = query || {};
		this.page = 1;
		this.blocks = [];
		this.lastPage = false;
		this._search();
	}

	public nextPage() {
		this.page += 1;

		this._search();
	}

	private _search() {
		this.loading = true;
		this.api.getBlocks({ ...this.query, page: this.page, size: this.pageSize })
			.pipe(finalize(() => this.loading = false))
			.subscribe(blocks => {
				this.lastPage = blocks.length < this.pageSize;
				this.blocks.push(...blocks);
			});
	}
}
