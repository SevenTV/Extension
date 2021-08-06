import { App } from 'src/Content/App/App';
import { EmoteStore } from 'src/Global/EmoteStore';
import { Logger } from 'src/Logger';
import { Twitch } from 'src/Page/Util/Twitch';
import { ChatInput } from 'src/Content/Components/ChatInput';
import ReactDOM from 'react-dom';
import React from 'react';
import { tap } from 'rxjs/operators';

export class TabCompleteDetection {
	tab = {
		index: 0,
		cursor: ''
	};

	private currentListener: ((this: HTMLTextAreaElement, ev: KeyboardEvent) => any) | undefined;
	private emotes = [] as EmoteStore.Emote[];

	constructor(public app: App) { }

	getInput(): HTMLTextAreaElement {
		return document.querySelector(Twitch.Selectors.ChatInput) as HTMLTextAreaElement;
	}

	updateEmotes(): void {
		this.emotes = this.app.emoteStore.getAllEmotes(['7TV', 'BTTV', 'FFZ']);
	}

	/**
	 * Start the tab completion
	 */
	start(): void {
		Logger.Get().info('Handling tab completion');
		const input = this.createOverlayInput() ?? this.getInput();

		const listener = this.currentListener = (ev) => {
			if (ev.key === 'Tab') {
				const foundEmotes = this.emotes.map(e => e.name);
				if (foundEmotes.length === 0) {
					return undefined;
				}

				this.handleTabPress(ev, foundEmotes);
			} else if (resetKeycodes.includes(ev.code)) { // Reset the cursor when the user is done typing an emote
				this.resetCursor();
			}
		};
		input.addEventListener('keydown', listener, {
			capture: false
		});
	}

	stop(): void {
		const input = this.getInput();

		if (typeof this.currentListener === 'function') {
			input.removeEventListener('keydown', this.currentListener);
		}
		this.emotes = [];
	}

	/**
	 * Reset the current cursor to the default state
	 */
	resetCursor(): void {
		this.tab.cursor = '';
		this.tab.index = 0;
	}

	/**
	 * Handle the user pressing tab, and trigger a cursor iteration to find which emote to replace
	 *
	 * @param ev the keyboard event involved
	 * @param emotes an array of emote name strings
	 */
	private handleTabPress(ev: KeyboardEvent, emotes: string[]): void {
		const input = this.getInput();
		const cursorValue = (this.tab.cursor || input.value).match(/\b(\w+)\W*$/)?.[0]; // The current value of the cursor, or the input if no cursor is set
		const currentWord = input.value.match(/\b(\w+)\W*$/)?.[0]; // The latest word typed by the user
		if (!cursorValue) return undefined;

		// Find emotes matching the cursor
		const entries = emotes.filter(e => startsWith(cursorValue ?? '', e));

		// There are entries found:
		// Prevent things from happening with the input beyond this point
		if (entries.length > 0) {
			ev.preventDefault();
			ev.stopPropagation();
		}

		// Loop cursor
		// (When the cursor index reached the amount of matching emotes)
		if (this.tab.cursor !== cursorValue) {
			this.tab.cursor = cursorValue;
			this.tab.index = -1;
		}
		this.tab.index >= (entries.length - 1) ? this.tab.index = 0 : this.tab.index++;

		// Find the next emote
		const next = entries[this.tab.index];
		if (!next) return undefined;

		// Request the pagescript to modify the input
		const final = currentWord ?? '';
		const lastOccurence = input.value.lastIndexOf(final);
		this.app.sendMessageDown('SetChatInput', input.value.slice(0, lastOccurence) + input.value.slice(lastOccurence).replace(final, next));
	}

	/**
	 * For the purpose of inline rendering
	 */
	createOverlayInput(): HTMLTextAreaElement {
		const container = document.createElement('div');
		container.classList.add('seventv-chat-input');

		const input = this.getInput();
		const ci = ReactDOM.render(<ChatInput emotes={this.emotes} originalInput={input} />, container) as unknown as ChatInput;
		ci.value.pipe(
			tap(v => this.app.sendMessageDown('SetChatInput', v))
		).subscribe();

		ci.send.subscribe({
			next: (v) => {
				this.app.sendMessageDown('SetChatInput', v);

				const event = new CustomEvent('seventv:virtualsend', { detail: v });
				input.dispatchEvent(event);
			}
		});

		input.classList.add('seventv-has-hidden-input-text');
		input.parentElement?.insertBefore(container, input);
		return ci.textArea.current as HTMLTextAreaElement;
	}
}

const startsWith = (prefix: string, emoteName: string): boolean =>
	emoteName.toLowerCase().startsWith(prefix.toLowerCase());

const resetKeycodes = [
	'Space', 'Backspace', 'Enter',
	'Delete'
];
