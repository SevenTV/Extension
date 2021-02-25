import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Subject } from 'rxjs';
import styled from 'styled-components';

console.log('Pag 12');

class Main extends React.Component {
	render() {
		return (
			<Main.Style>

			</Main.Style>
		);
	}
}

namespace Main {
	export const Style = styled.div``;
}

const app = document.createElement('div');
app.id = 'seventv';
document.body.appendChild(app);
ReactDOM.render(<Main />, app);

import('./Util/ChatListener').then(m => new m.ChatListener());

export const Content = {
	onMessage: new Subject<any>()
};

chrome.runtime.onMessage.addListener(msg => {
	console.log('Msg from background', msg);
	Content.onMessage.next(msg);

	return true;
});
