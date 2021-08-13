import { Twitch } from 'src/Page/Util/Twitch';
import ReactDOM from 'react-dom';
import React from 'react';
import { ChatInput } from 'src/Page/Components/ChatInput';
import { PageScript } from 'src/Page/Page';
import { Logger } from 'src/Logger';
import { unicodeTag0 } from 'src/Global/Util';
import { noop } from 'rxjs';

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

	waitForNextSend(input: HTMLInputElement, ctrl = false): void {
		let listener: (ev: KeyboardEvent) => any;
		let releaseCtrl: (ev: KeyboardEvent) => any;
		input.addEventListener('keydown', listener = (ev) => {
			const target = ev.target as HTMLInputElement;
			const value = target.value ?? '';

			// User presses enter: message will be sent
			if (ev.key === 'Enter') {
				if (this.page.config.get('general.allow_send_twice')?.asBoolean()) {
					let value = target.value;

					const endChar = value.charAt(value.length -1);
					// If message is duplicate we must edit the input value with a unicode tag
					if (this.lastMessage === target.value) {
						ev.preventDefault(); // For now cancel & stop the propgagation
						ev.stopPropagation();

						// Append or remove the unicode tag
						value = endChar === unicodeTag0
							? value.slice(0, value.length - 1)
							: value += unicodeTag0;

						// Patch the input value
						this.setInputValue(this.lastMessage = value);

						// Resume the event
						input.removeEventListener('keydown', listener);
						setTimeout(() => target.dispatchEvent(ev), 0);
						setTimeout(() => restart(), 100);
					}
					this.lastMessage = value;
				}

				if (ctrl) {
					// Temporarily lock the input
					input.setAttribute('disabled', 'true');
					setTimeout(() => this.setInputValue(value), 25);
					setTimeout(() => {
						input.removeAttribute('disabled');
						input.focus();
					}, (this.page.isActorModerator || this.page.isActorVIP) ? 150 : 1100);
				}
			} else if (ev.key === 'Control') {
				// Handle Ctrl+Enter (detect control key being held)
				ctrl = true;
			}
		});
		input.addEventListener('keyup', releaseCtrl = ev => ev.key === 'Control' ? ctrl = false : noop());

		const restart = () => {
			this.waitForNextSend(input, ctrl);
			input.removeEventListener('keyup', releaseCtrl);
		};
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
