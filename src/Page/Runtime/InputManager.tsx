import { Twitch } from 'src/Page/Util/Twitch';
import ReactDOM from 'react-dom';
import React from 'react';
import { ChatInput } from 'src/Page/Components/ChatInput';
import { PageScript } from 'src/Page/Page';
import { Logger } from 'src/Logger';
import { unicodeTag0 } from 'src/Global/Util';
import { fromEvent, Subject } from 'rxjs';
import { filter, mergeMap, take, takeUntil, tap } from 'rxjs/operators';

export class InputManager {
	private twitch = new Twitch();

	tab = {
		index: 0,
		entry: ''
	};
	lastMessage = '';
	history = [''] as string[];
	historyPos = 0;
	ctrl = false;

	restart = new Subject<void>();

	constructor(private page: PageScript) { }

	/**
	 * Listen to keyboard inputs
	 */
	listen(): void {
		const input = this.getInput();
		if (!input) throw Error('Chat Text Input not found!');
		this.restart.next(undefined);

		Logger.Get().info(`Managing chat input`);

		// Handle send
		this.waitForNextSend(input);

		// Determine state of control press
		fromEvent<KeyboardEvent>(document, 'keydown').pipe(
			takeUntil(this.restart),
			filter(ev => ev.key === 'Control'), // User presses control
			tap(() => this.ctrl = true), // Store the state

			// Listen for end of press
			mergeMap(() => fromEvent<KeyboardEvent>(document, 'keyup').pipe(
				filter(ev => ev.key === 'Control'),
				take(1)
			)), // And set the ctrl state to false
			tap(() => this.ctrl = false),
		).subscribe();
	}

	waitForNextSend(input: HTMLInputElement): void {
		let listener: (ev: KeyboardEvent) => any;
		input.addEventListener('keydown', listener = (ev) => {
			const target = ev.target as HTMLInputElement;
			const value = (target.value ?? '');
			const normalizedValue = [...value]
				.filter(char => char.charCodeAt(0) !== unicodeTag0.charCodeAt(0))
				.join('').trim();
			this.history[0] = normalizedValue;

			// User presses enter: message will be sent
			if (ev.key === 'Enter') {
				if (this.page.config.get('general.allow_send_twice')?.asBoolean()) {
					let value = target.value;
					if (value === '') {
						return undefined;
					}

					const endChar = value.charAt(value.length -1);
					// If message is duplicate we must edit the input value with a unicode tag
					if (this.lastMessage === target.value) {
						ev.preventDefault(); // For now cancel & stop the propgagation
						ev.stopPropagation();

						// Append or remove the unicode tag
						value = endChar === ' ' + unicodeTag0
							? value.slice(0, value.length - 2)
							: value + (' ' + unicodeTag0);

						// Patch the input value
						this.setInputValue(this.lastMessage = value);

						// Resume the event
						input.removeEventListener('keydown', listener);
						setTimeout(() => target.dispatchEvent(ev), 0);
						setTimeout(() => restart(), 25);
					}
					this.lastMessage = value;
					this.historyPos = 0;
					if (this.history[1] !== normalizedValue) {
						this.history = ['', normalizedValue, ...new Set(this.history.slice(1))];
					}
				}

				if (this.ctrl) {
					// Temporarily lock the input
					input.setAttribute('disabled', 'true');
					setTimeout(() => this.setInputValue(value), 25);
					setTimeout(() => {
						input.removeAttribute('disabled');
						input.focus();
					}, (this.page.isActorModerator || this.page.isActorVIP) ? 100 : 1100); // Control cooldown depending on whether user is mod/vip or pleb
				}
			} else if (ev.key === 'ArrowUp' && target.selectionStart === 0) { // Handle up-arrow (navigate back in history)
				const newVal = this.history.slice(1)[this.historyPos];
				if (typeof newVal === 'undefined') {
					this.historyPos--;
				} else {
					this.historyPos++;
					this.setInputValue(newVal);
				}
			} else if (ev.key === 'ArrowDown' && target.selectionEnd === value.length) { // Handle down-arrow (navigate forward in history)
				this.historyPos--;
				const newVal = this.history.slice(1)[this.historyPos];
				if (typeof newVal === 'undefined') {
					this.historyPos++;
					this.setInputValue('');
				} else {
					this.setInputValue(newVal);
				}
			}
		});

		const restart = () => {
			this.waitForNextSend(input);
		};
		// Handle input handler restart
		this.restart.pipe(tap(() => input.removeEventListener('keydown', listener))).subscribe();
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
