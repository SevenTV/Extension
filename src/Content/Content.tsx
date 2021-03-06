import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Subject } from 'rxjs';
import { Logger } from 'src/Logger';
import styled from 'styled-components';

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
	Content.onMessage.next(msg);

	return true;
});

Logger.Get().info('Extension active!');

window.onbeforeunload = () => chrome.runtime.sendMessage({
	tag: 'Unload'
});
