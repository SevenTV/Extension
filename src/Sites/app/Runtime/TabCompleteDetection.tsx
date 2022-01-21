import { Subject } from 'rxjs';
import { EmoteStore } from 'src/Global/EmoteStore';
import { Logger } from 'src/Logger';
import { SiteApp } from 'src/Sites/app/SiteApp';
import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';

const MAX_CHATTERS = 250;
export class TabCompleteDetection {
	inputValue = new Subject<TabCompleteDetection.InputChange>();
	tab = {
		index: 0,
		cursor: '',
		expectedValue: '',
		expectedCursorLocation: 0
	};

	private keyListener: ((this: HTMLInputElement, ev: KeyboardEvent) => any) | undefined;
	private finalizeListener: ((this: HTMLInputElement, ev: Event) => any) | undefined;
	private emotes = [] as EmoteStore.Emote[];
	private chatters = [] as string[];

	constructor(public app: SiteApp) { }

	getInput(): HTMLInputElement {
		return document.querySelector(Twitch.Selectors.ChatInput) as HTMLInputElement;
	}

	/**
	 * @returns a list of values that could be auto-completed
	 */
	getAllCompletables(): string[] {
		const result = [] as string[];
		result.push(...this.emotes.map(e => e.name));
		if (this.app.config.get('general.autocomplete_chatters')?.asBoolean()) {
			result.push(...this.chatters);
		}

		return result;
	}

	updateEmotes(): void {
		this.emotes = this.app.emoteStore.getAllEmotes(['7TV', 'BTTV', 'FFZ', 'TWITCH']).sort((a, b) => a.name.localeCompare(b.name));
	}

	/**
	 * Add a chatter to the list of active chatters, making them tab-completable
	 *
	 * @param displayName the chatter's display name that will be used for tab completion
	 */
	addChatter(displayName: string): void {
		if (this.chatters.indexOf(displayName) !== -1) { // Skip if the chatter is already known
			return undefined;
		}

		this.chatters.unshift(displayName);
		if (this.chatters.length > MAX_CHATTERS) {
			this.chatters.pop();
		}
	}

	/**
	 * Start the tab completion
	 */
	start(): void {
		Logger.Get().info('Handling tab completion');
		const input = this.getInput();
		if (!input) {
			return undefined;
		}

		this.keyListener = (ev) => {
			if (ev.key === 'Tab') {
				// Option is enabled?
				if (!this.app.config.get('general.autocomplete')?.asBoolean()) {
					return undefined;
				}

				const tabValues = this.getAllCompletables();
				if (tabValues.length === 0) {
					return undefined;
				}

				const input = ev.target as HTMLInputElement;
				let value = input.value;
				let selectionStart = input.selectionStart;

				if (!value) {
					const el = (window as any).twitch.getChatInput();
					value = el.props.value;
					selectionStart = el.selectionStart;
				}

				if (value != this.tab.expectedValue) this.resetCursor();
				else if (selectionStart != this.tab.expectedCursorLocation) this.resetCursor();

				this.handleTabPress(ev, tabValues);
			}
		};
		input.addEventListener('keydown', this.keyListener, {
			capture: true
		});

		this.finalizeListener = () => this.resetCursor();
		input.addEventListener('change', this.finalizeListener, {
			capture: false
		});

	}

	stop(): void {
		const input = this.getInput();

		if (typeof this.keyListener === 'function') {
			input.removeEventListener('keydown', this.keyListener);
		}

		if (typeof this.finalizeListener === 'function') {
			input.removeEventListener('change', this.finalizeListener);
		}

		this.emotes = [];
	}

	/**
	 * Reset the current cursor to the default state
	 */
	resetCursor(): void {
		this.tab.cursor = '';
		this.tab.index = 0;
		this.tab.expectedValue = '';
		this.tab.expectedCursorLocation = 0;
	}

	/**
	 * Handle the user pressing tab, and trigger a cursor iteration to find which emote to replace
	 *
	 * @param ev the keyboard event involved
	 * @param emotes an array of emote name strings
	 */
	private handleTabPress(ev: KeyboardEvent, emotes: string[]): void {
		const input = ev.target as HTMLInputElement;
		// Twitch inserts a special character in front of emotes
		const inputText = (input.value ?? input.textContent).replace(/﻿/g, '');
		const cursorPosition = input.selectionStart ?? (window as any).twitch?.getChatInput()?.selectionStart ?? 0;

		let searchStart = cursorPosition - 1;
		let startIndex = 0;
		for (let i = searchStart; i >= 0; i--) { // Search backwards until we find a space
			const currentChar = inputText.charAt(i);
			if (currentChar == ' ' && i != searchStart) { // If the first character we hit is a space, skip it
				startIndex = i + 1;
				break;
			}
		}

		let currentWord = inputText.substring(startIndex, cursorPosition);

		const cursorValue = this.tab.cursor || currentWord; // The current value of the cursor, or the input if no cursor is set
		if (!cursorValue) return undefined;

		// Find emotes matching the cursor
		const entries = emotes.filter(e => startsWith(cursorValue ?? '', e));

		// There are entries found:
		// Prevent things from happening with the input beyond this point
		if (entries.length > 0) {
			ev.preventDefault();
			ev.stopImmediatePropagation();
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
		const firstMessageHalf = inputText.substring(0, startIndex) + next + ' ';
		const newMessage = (firstMessageHalf + inputText.substring(cursorPosition)).slice(0, 500);
		const newCursorPosition = firstMessageHalf.length;

		this.tab.expectedValue = newMessage;
		this.tab.expectedCursorLocation = newCursorPosition;

		// Delay the input patch by a tick in order to override BTTV
		setTimeout(() => {
			this.inputValue.next({ message: newMessage, cursorPosition: newCursorPosition });
		}, 0);
	}
}

export namespace TabCompleteDetection {
	export interface InputChange {
		message: string;
		cursorPosition: number;
	}
}

const startsWith = (prefix: string, emoteName: string): boolean =>
	emoteName.toLowerCase().startsWith(prefix.toLowerCase());
