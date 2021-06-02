import { Twitch } from 'src/Page/Util/Twitch';
import React from 'react';
import ReactDOM from 'react-dom';
import { MessageBody } from 'src/Page/Components/MessageBody';
import { App } from 'src/Content/App/App';
import { MessageTree } from 'src/Content/Runtime/MessageTree';

export class MessageRenderer {
	private jsx = [] as JSX.Element[];
	constructor(
		public app: App,
		public msg: Twitch.ChatMessage,
		public elementId: string
	) { }

	getChatContainer() {
		return document.querySelector(Twitch.Selectors.ChatScrollableContainer);
	}

	getElement(): HTMLDivElement | null {
		return document.getElementById(this.elementId) as HTMLDivElement;
	}

	insert(): void {
		const el = this.getElement();
		if (!el) return undefined;

		// Delete previous message context if it exists
		const currentContext = el.querySelectorAll('.seventv-message-context');
		currentContext.forEach(c => {
			el.removeChild(c);
			c.remove();
		});

		const container = el.querySelector('.chat-line__no-background') ?? el.querySelector(Twitch.Selectors.ChatMessageContainer) ?? el;
		el.querySelector('.message')?.remove();
		const newContext = document.createElement('span');
		newContext.classList.add('seventv-message-context');
		newContext.style.position = 'relative';

		ReactDOM.render(<MessageBody renderer={this} id={this.msg.id} parts={this.jsx} />, newContext);
		container.appendChild(newContext);
	}

	renderMessageTree(): JSX.Element[] {
		const tree = new MessageTree(this);

		return this.jsx = tree.fill();
	}
}
