import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';
import ReactDOM from 'react-dom';
import React from 'react';
import { ChatInput } from 'src/Sites/twitch.tv/Components/ChatInput';
import { TwitchPageScript } from 'src/Sites/twitch.tv/twitch';
import { Logger } from 'src/Logger';
import { unicodeTag0 } from 'src/Global/Util';
import { Subject } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

const TAG0_REGEX = new RegExp(unicodeTag0, 'g');

export class InputManager {
	private twitch = new Twitch();

	tab = {
		index: 0,
		entry: ''
	};
	history = [''] as string[];
	historyPos = 0;

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

		this.handleHistory(input);
		this.handleIRC(input);
	}

	handleIRC(input: HTMLInputElement): void {
		// Find the WebSocket IRC
		const cs = this.twitch.getChatService();
		if (!cs || !cs.client?.connection) {
			Logger.Get().warn('Unable to hook into chat service. Some features will not work');
			return;
		}
		const ws = cs.client.connection.ws;
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			// Retry in 500ms if connection is not open
			Logger.Get().debug('<IRC> Connection not open, retrying');
			setTimeout(() => this.handleIRC(input), 1000);
			return;
		}
		this.page.insertEmotesIntoAutocomplete();

		// Get chat controllers
		const isAllowSendTwice = () => this.page.site.config.get('general.allow_send_twice')?.asBoolean();
		const chatController = this.twitch.getChatController();
		const controller = this.twitch.getInputController();
		if (!controller || !chatController) {
			Logger.Get().warn('Unable to take control of chat input. Some features will not work');
			return;
		}

		// Overwrite the dupe message and throughput checks
		// We want to prevent them when the user is useful spam features
		const actorCanSpam = this.page.isActorModerator || this.page.isActorVIP;
		const dupeCheck = controller.props.sendMessageErrorChecks?.['duplicated-messages']?.check;
		const throughputCheck = controller.props.sendMessageErrorChecks?.['message-throughput']?.check;
		if (!!dupeCheck) {
			let sentAdvice = false;
			const sendAdvice = () => {
				if (sentAdvice || actorCanSpam) {
					return;
				}
				this.page.chatListener?.sendSystemMessage('Enable the setting "Allow sending the same message twice" in the 7TV settings menu to bypass Twitch\'s duplicate message restriction');
				sentAdvice = true;
			};
			controller.props.sendMessageErrorChecks['duplicated-messages'].check = function (s: string) {
				if (!isAllowSendTwice()) {
					const restricted = dupeCheck.apply(this, [s]);
					if (restricted) {
						sendAdvice(); // Advice: use 7TV to send the same message twice forsenBased
					}
					return restricted;
				} else {
					return false;
				}
			};
		}
		if (!!throughputCheck) {
			controller.props.sendMessageErrorChecks['message-throughput'].check = function(s: string) {
				// Hide the throughput warning if the using is using ctrl+enter
				return keepInput ? false : throughputCheck.apply(this, [s]);
			};
		}

		const ircSend = ws.send;
		let alt = false;
		let prevMessage = '';
		ws.send = function (s: string) {
			const content = s.split(' :')[1];
			if (!actorCanSpam && isAllowSendTwice()) {
				if (typeof content === 'string' && content === prevMessage) {
					// Remove existing unicode tags
					// avoids conflict with other extensions
					s = s.replace(TAG0_REGEX, '');

					// Set alternate unicode tag suffix
					alt = !alt;
					if (alt) {
						s += ' ' + unicodeTag0;
					}
				} else {
					alt = false;
				}
			}

			prevMessage = content;
			if (!!ircSend && typeof ircSend === 'function') {
				try {
					return ircSend.apply(this, [s]);
				} catch (err) {
					Logger.Get().error('error occured whilst mutating irc input');
				}
			}
		};

		// Handle closure
		// We must restart the input manager if this happens
		ws.addEventListener('close', (close) => {
			Logger.Get().debug(`<InputManager> Detected IRC closure with code ${close.code}`);
			Logger.Get().info(`<InputManager> IRC connection lost, restarting`);
			this.restart.next(undefined);
			this.listen();
		}, { once: true });

		let cooldown = false;
		let keepInput = false;
		const initialOnSend = controller.props.onSendMessage;
		const initOnUpdate = controller.componentDidUpdate;
		controller.componentDidUpdate = function (p, st) {
			overwriteOnSend();
			return initOnUpdate?.apply(this, [p, st]);
		};
		const overwriteOnSend = () => {
			controller.props.onSendMessage = function(s: string, reply) {
				if (keepInput) {
					if (!cooldown) {
						// Set a cooldown
						// This is 100ms as Mod/VIP, or ~1s as a plen. (we add an extra 250ms to account for latency)
						cooldown = true;
						setTimeout(() => {
							cooldown = false;
						}, actorCanSpam ? 100 : 1250);

						chatController.props.chatConnectionAPI.sendMessage(s);
					}
					return;
				}
				return initialOnSend.apply(this, [s, reply]);
			};
		};
		input.addEventListener('keyup', (ev) => keepInput = ev.ctrlKey);
		input.addEventListener('keydown', (ev) => keepInput = ev.ctrlKey);

		this.restart.pipe(take(1)).subscribe({
			next: () => {
				controller.componentDidUpdate = initOnUpdate;
				controller.props.onSendMessage = initialOnSend;
				ws.send = ircSend;
				if (!!controller.props.sendMessageErrorChecks?.['duplicated-messages']) {
					controller.props.sendMessageErrorChecks['duplicated-messages'].check = dupeCheck;
				}
				if (!!controller.props.sendMessageErrorChecks?.['message-throughput']) {
					controller.props.sendMessageErrorChecks['message-throughput'].check = throughputCheck;
				}
			}
		});
	}

	handleHistory(initInput: HTMLInputElement): void {
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
		this.restart.pipe(take(1), tap(() => initInput.removeEventListener('keydown', listener))).subscribe();
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
