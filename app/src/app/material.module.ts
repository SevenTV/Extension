import { NgModule } from '@angular/core';

// Import angular material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

const modules = [
	MatToolbarModule,
	MatRippleModule,
	MatIconModule
];

@NgModule({
	declarations: [],
	imports: [...modules],
	exports: [
		...modules
	]
})

export class MaterialModule { }
