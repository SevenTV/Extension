import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';
import ReactDOM from 'react-dom';
import React from 'react';
import { ChatInput } from 'src/Sites/twitch.tv/Components/ChatInput';
import { TwitchPageScript } from 'src/Sites/twitch.tv/twitch';
import { Logger } from 'src/Logger';
import { unicodeTag0 } from 'src/Global/Util';
import { Subject } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

export class InputManager {
	private twitch = new Twitch();

	tab = {
		index: 0,
		entry: ''
	};
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

		this.handleSpam(input);
	}

	handleSpam(input: HTMLInputElement): void {
		// Find the WebSocket IRC
		const cs = this.twitch.getChatService();
		if (!cs) {
			return;
		}
		const ws = cs.client.connection.ws;
		if (!ws) {
			return;
		}

		// Put a middleware in the websocket send
		const isAllowSendTwice = () => this.page.site.config.get('general.allow_send_twice');
		const chatController = this.twitch.getChatController();
		const controller = this.twitch.getInputController();
		if (!controller || !chatController) {
			return;
		}
		const dupeCheck = controller.props.sendMessageErrorChecks['duplicated-messages']?.check;
		if (!!dupeCheck) {
			controller.props.sendMessageErrorChecks['duplicated-messages'].check = function (s: string) {
				return isAllowSendTwice() ? false : dupeCheck.apply(this, [s]);
			};
		}

		const actorCanSpam = this.page.isActorModerator || this.page.isActorVIP;
		const x = ws.send;
		let cooldown = false;
		let alt = false;
		ws.send = function (s: string) {
			if (isAllowSendTwice()) {
				if (!alt) {
					s += ' ' + unicodeTag0;
				}
				alt = !alt;
			}

			if (!cooldown) {
				cooldown = true;
				setTimeout(() => {
					cooldown = false;
				}, actorCanSpam ? 100 : 750);
			}
			if (!!x && typeof x === 'function') {
				try {
					return x.apply(this, [s]);
				} catch (err) {
					Logger.Get().error('error occured whilst mutating irc input');
				}
			}
		};

		let keepInput = false;
		const initialOnSend = controller.props.onSendMessage;
		const initOnUpdate = controller.componentDidUpdate;
		controller.componentDidUpdate = function (p, st) {
			controller.props.onSendMessage = function(s: string) {
				if (keepInput) {
					if (!cooldown) {
						chatController.props.chatConnectionAPI.sendMessage(s);
					}
					return;
				}
				return initialOnSend.apply(this, [s]);
			};
			return initOnUpdate?.apply(this, [p, st]);
		};
		input.addEventListener('keyup', (ev) => keepInput = ev.ctrlKey);
		input.addEventListener('keydown', (ev) => keepInput = ev.ctrlKey);

		this.restart.pipe(take(1)).subscribe({
			next: () => {
				controller.componentDidUpdate = initOnUpdate;
				controller.props.onSendMessage = initialOnSend;
				ws.send = x;
				if (!!dupeCheck) {
					controller.props.sendMessageErrorChecks['duplicated-messages'].check = dupeCheck;
				}
			}
		});
	}

	waitForNextSend(initInput: HTMLInputElement): void {
		let listener: (ev: KeyboardEvent) => any;
		initInput.addEventListener('keydown', listener = (ev) => {
			const input = ev.target as HTMLInputElement;
			if (!input) {
				Logger.Get().debug('waitForNextSend() failed to find chat input');
				return undefined;
			}
			const historyEnabled = this.page.site.config.get('general.history_navigation')?.asBoolean();
			const value = (input.value ?? input.textContent).replace(/﻿ /g, '');

			// User presses enter: message will be sent
			if (ev.key === 'Enter') {
				this.history[0] = value;

				// Save messages to history?
				if (historyEnabled) {
					this.historyPos = 0;
					const sval = sanitizeValue(value);
					if (this.history[1] !== sval) {
						this.history = ['', sval, ...new Set(this.history.slice(1))];
					}
				}
			}
			if (historyEnabled) {
				if (ev.key === 'ArrowUp' && (input.selectionStart ?? this.twitch.getChatInput().selectionStart) === 0) { // Handle up-arrow (navigate back in history)
					const newVal = this.history.slice(1)[this.historyPos];
					if (typeof newVal === 'undefined') {
						this.historyPos--;
					} else {
						this.historyPos++;
						this.setInputValue(sanitizeValue(newVal));
					}
				} else if (ev.key === 'ArrowDown' && (input.selectionEnd ?? this.twitch.getChatInput().selectionStart) === value.length) { // Handle down-arrow (navigate forward in history)
					this.historyPos--;
					const newVal = this.history.slice(1)[this.historyPos];
					if (typeof newVal === 'undefined') {
						this.historyPos++;
					} else {
						this.setInputValue(sanitizeValue(newVal));
					}
				}
			}
		});

		const sanitizeValue = (v: string) => v.replace('﻿', '').replace(new RegExp(unicodeTag0, 'g'), '');
		// const restart = () => {
		// 	this.waitForNextSend(initInput);
		// };
		// Handle input handler restart
		this.restart.pipe(tap(() => initInput.removeEventListener('keydown', listener))).subscribe();
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
			?? document.querySelector(Twitch.Selectors.ChatInput)) as HTMLInputElement;
	}

	setInputValue(value: string): void {
		value = value.replace(/�/g, ''); // omit weird character
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
			el.onChange({ target: { value: value } });
		}
	}

	setInputCursorPosition(position: number) {
		const el = document.querySelector('.chat-input textarea') as HTMLInputElement ?? this.twitch.getChatInput();
		el.setSelectionRange(position, position);
	}
}
