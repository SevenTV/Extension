import { Twitch } from 'src/Page/Util/Twitch';
import ReactDOM from 'react-dom';
import React from 'react';
import { ChatInput } from 'src/Page/Components/ChatInput';
import { PageScript } from 'src/Page/Page';
import { Logger } from 'src/Logger';
import { unicodeTag0 } from 'src/Global/Util';

export class InputManager {
	private twitch = new Twitch();

	tab = {
		index: 0,
		entry: ''
	};
	lastMessage = '';

	constructor(private page: PageScript) { }

	/**
	 * Listen to keyboard inputs
	 */
	listen(): void {
		const input = this.getInput();
		if (!input) throw Error('Chat Text Input not found!');

		Logger.Get().info(`Managing chat input`);

		this.waitForNextSend(input);
	}

	waitForNextSend(input: HTMLInputElement): void {
		let listener: (ev: KeyboardEvent) => any;
		input.addEventListener('keydown', listener = (ev) => {
			if (!this.page.config.get('general.allow_send_twice')?.asBoolean()) {
				return undefined;
			}

			const target = ev.target as HTMLInputElement;

			// User presses enter: message will be sent
			if (ev.key === 'Enter') {
				console.log('Send:', target.value);
				ev.preventDefault(); // For now cancel & stop the propgagation
				ev.stopPropagation();

				// We must edit the message with a unicode tag
				let value = target.value;

				const endChar = value.charAt(value.length -1);
				if (this.lastMessage === target.value) {
					value = endChar === unicodeTag0
						? value.slice(0, value.length - 1)
						: value += unicodeTag0;

					this.setInputValue(value);
				}
				this.lastMessage = value;

				// Resume the event
				input.removeEventListener('keydown', listener);
				setTimeout(() => target.dispatchEvent(ev), 0);
				setTimeout(() => restart(), 100);
			}
		});

		const restart = () => this.waitForNextSend(input);
	}

	createOverlayInput(): void {
		const container = document.createElement('div');
		container.classList.add('seventv-chat-input');

		const input = this.getInput();
		ReactDOM.render(<ChatInput emotes={this.page.getAllEmotes()} originalInput={input} />, container);

		input.classList.add('seventv-has-hidden-input-text');
		input.parentElement?.insertBefore(container, input);
	}

	getInput(): HTMLInputElement {
		return document.querySelector(Twitch.Selectors.ChatInput) as HTMLInputElement;
	}

	setInputValue(value: string): void {
		const el = document.querySelector(Twitch.Selectors.ChatInput) as HTMLInputElement;
		el.value = value;
		el.dispatchEvent(new Event('input', { bubbles: true }));

		const inst = this.twitch.getReactInstance(el) as Twitch.TwitchPureComponent;

		if (inst) {
			const props = inst.memoizedProps;
			if (props && props.onChange) {
				props.onChange({ target: el });
			}
		}
	}

	setInputCursorPosition(position: number) {
		const el = document.querySelector(Twitch.Selectors.ChatInput) as HTMLInputElement;
		el.setSelectionRange(position, position);
	}
}
