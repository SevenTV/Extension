import React from 'react';
import ReactDOM from 'react-dom';
import { MainComponent } from 'src/Content/Components/MainComponent';
import { Child } from 'src/Content/Global/Decorators';

@Child
export class App implements Child.OnInjected {
	onInjected(): void {
		const app = document.createElement('div');
		app.classList.add('seventv-overlay');
		app.style.position = 'absolute';
		app.id = 'seventv';

		const target = document.getElementById('root');
		ReactDOM.render(<MainComponent />, app);

		target?.firstChild?.appendChild(app);
	}
}
