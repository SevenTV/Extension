import * as React from 'react';
import { render as ReactDOMRender } from 'react-dom';
import { ChatListener } from './Util/ChatListener';

console.log('Pag 11');

class Main extends React.Component {
	render() {
		return (
			<div>SevenTV is loaded!</div>
		)
	}
}

const app = document.createElement('div');
app.id = 'seventv';
document.body.appendChild(app);
ReactDOMRender(<Main />, app);

const listener = new ChatListener();
listener.start();