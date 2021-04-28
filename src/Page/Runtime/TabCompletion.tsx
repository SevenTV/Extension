import { Observable, Subject, throwError } from 'rxjs';
import { Twitch } from 'src/Page/Util/Twitch';
import ReactDOM from 'react-dom';
import React from 'react';
import { ChatInput } from 'src/Page/Components/ChatInput';

export class TabCompletion {
	private twitch = new Twitch();

	onInputEvent = new Subject<KeyboardEvent>();

	constructor() {}

	/**
	 * Listen to keyboard inputs
	 */
	listen(): Observable<KeyboardEvent> {
		const input = this.getInput();
		if (!input) return throwError(Error('Chat Text Input not found!'));

		return new Observable<KeyboardEvent>(observer => {
			input.onkeydown = (ev) => {
				setTimeout(() => {
					observer.next(ev);
					this.onInputEvent.next(ev);
				}, 0);
			};
		});
	}

	createOverlayInput(): void {
		const container = document.createElement('div');
		container.classList.add('seventv-chat-input');

		const input = this.getInput();
		ReactDOM.render(<ChatInput originalInput={input} />, container);

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
}
