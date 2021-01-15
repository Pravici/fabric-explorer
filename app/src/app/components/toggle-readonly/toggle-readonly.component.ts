import { Component, Input, ViewChild } from '@angular/core';
import { NbToggleComponent } from '@nebular/theme';

@Component({
	selector: 'fabric-explorer-toggle-readonly',
	templateUrl: './toggle-readonly.component.html',
})
export class ToggleReadonlyComponent {
	@Input() labelPosition = 'end';
	@Input() status = '';
	@Input() checked = true;
	@ViewChild('toggle', { static: false }) toggle: NbToggleComponent;

	constructor() { }

	public toggleClick() {
		this.toggle.checked = this.checked;
	}
}
