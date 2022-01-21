import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';
import ReactDOM from 'react-dom';
import React from 'react';
import { ChatInput } from 'src/Sites/twitch.tv/Components/ChatInput';
import { TwitchPageScript } from 'src/Sites/twitch.tv/twitch';
import { Logger } from 'src/Logger';
import { unicodeTag0 } from 'src/Global/Util';
import { Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export class InputManager {
	private twitch = new Twitch();

	tab = {
		index: 0,
		entry: ''
	};
	lastMessage = '';
	history = [''] as string[];
	historyPos = 0;
	noticedAboutAllowSendTwice = false;

	restart = new Subject<void>();

	constructor(private page: TwitchPageScript) { }

	/**
	 * Listen to keyboard inputs
	 */
	listen(): void {
		this.page.site.tabCompleteDetector.inputValue.pipe(
			map(change => {
				this.setInputValue(change.message);
				this.setInputCursorPosition(change.cursorPosition);
			})
		).subscribe();
		this.restart.next(undefined);

		const input = this.getInput();
		if (!input) return;

		Logger.Get().info(`Managing chat input`);

		// Handle send
		this.waitForNextSend(input);

	}

	waitForNextSend(input: HTMLInputElement): void {
		let listener: (ev: KeyboardEvent) => any;
		input.addEventListener('keydown', listener = (ev) => {
			const historyEnabled = this.page.site.config.get('general.history_navigation')?.asBoolean();
			const target = ev.target as HTMLInputElement;
			let value = (target.value ?? this.twitch.getChatInput()?.props.value ?? '');
			const normalizedValue = [...value]
				.filter(char => char.charCodeAt(0) !== unicodeTag0.charCodeAt(0))
				.join('').trim();
			this.history[0] = normalizedValue;

			// User presses enter: message will be sent
			if (ev.key === 'Enter') {
				if (this.page.site.config.get('general.allow_send_twice')?.asBoolean()) {
					if (value === '') {
						return undefined;
					}

					const endChar = value.charAt(value.length - 1);
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
				} else { // Notify the user they could enable the setting to send duplicate messages
					if (this.lastMessage === target.value && !this.noticedAboutAllowSendTwice) {
						this.noticedAboutAllowSendTwice = true;
						this.page.chatListener.sendSystemMessage('Enable the setting "Allow sending the same message twice" in the 7TV settings menu to bypass the duplicate message restriction');
					}
					this.lastMessage = value;
				}

				// Save messages to history?
				if (historyEnabled) {
					this.historyPos = 0;
					if (this.history[1] !== normalizedValue) {
						this.history = ['', normalizedValue, ...new Set(this.history.slice(1))];
					}
				}

				if (ev.ctrlKey) {
					// Temporarily lock the input
					input.setAttribute('disabled', 'true');
					setTimeout(() => this.setInputValue(value), 25);
					setTimeout(() => {
						input.removeAttribute('disabled');
						input.focus();
					}, (this.page.isActorModerator || this.page.isActorVIP) ? 100 : 1100); // Control cooldown depending on whether user is mod/vip or pleb
				}
			}
			if (historyEnabled) {
				if (ev.key === 'ArrowUp' && (target.selectionStart ?? this.twitch.getChatInput().selectionStart) === 0) { // Handle up-arrow (navigate back in history)
					const newVal = this.history.slice(1)[this.historyPos];
					if (typeof newVal === 'undefined') {
						this.historyPos--;
					} else {
						this.historyPos++;
						this.setInputValue(newVal);
					}
				} else if (ev.key === 'ArrowDown' && (target.selectionEnd ?? this.twitch.getChatInput().selectionStart) === value.length) { // Handle down-arrow (navigate forward in history)
					this.historyPos--;
					const newVal = this.history.slice(1)[this.historyPos];
					if (typeof newVal === 'undefined') {
						this.historyPos++;
					} else {
						this.setInputValue(newVal);
					}
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
		return (document.querySelector('.chat-input textarea')
			??  document.querySelector(Twitch.Selectors.ChatInput)) as HTMLInputElement;
	}

	setInputValue(value: string): void {
		const el = document.querySelector('.chat-input textarea') as HTMLInputElement;
		if (el && typeof el.value != undefined) {
			el.value = value;
			el.dispatchEvent(new Event('input', { bubbles: true }));

			const inst = this.twitch.getReactInstance(el) as Twitch.TwitchPureComponent;

			if (inst) {
				const props = inst.memoizedProps;
				if (props && props.onChange) {
					props.onChange({ target: el });
				}
			}
		} else {
			const el = this.twitch.getChatInput()?.props;
			el.onChange({target: {value: value}});
		}
	}

	setInputCursorPosition(position: number) {
		const el = document.querySelector('.chat-input textarea') as HTMLInputElement ?? this.twitch.getChatInput();
		el.setSelectionRange(position, position);
	}
}
