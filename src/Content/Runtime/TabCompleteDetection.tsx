import { App } from 'src/Content/App/App';
import { settings } from 'src/Content/Runtime/Settings';
import { EmoteStore } from 'src/Global/EmoteStore';
import { Logger } from 'src/Logger';
import { Twitch } from 'src/Page/Util/Twitch';

export class TabCompleteDetection {
	tab = {
		index: 0,
		cursor: '',
		expectedValue: '',
		expectedCursorLocation: 0
	};

	private keyListener: ((this: HTMLInputElement, ev: KeyboardEvent) => any) | undefined;
	private finalizeListener: ((this: HTMLInputElement, ev: Event) => any) | undefined;
	private emotes = [] as EmoteStore.Emote[];

	constructor(public app: App) { }

	getInput(): HTMLInputElement {
		return document.querySelector(Twitch.Selectors.ChatInput) as HTMLInputElement;
	}

	updateEmotes(): void {
		this.emotes = this.app.emoteStore.getAllEmotes(['7TV', 'BTTV', 'FFZ', 'TWITCH']).sort((a, b) => a.name.localeCompare(b.name));
	}

	/**
	 * Start the tab completion
	 */
	start(): void {
		Logger.Get().info('Handling tab completion');
		const input = this.getInput();

		this.keyListener = (ev) => {
			if (ev.key === 'Tab') {
				// Option is enabled?
				if (!settings.get('general.autocomplete').asBoolean()) {
					return undefined;
				}

				const foundEmotes = this.emotes.map(e => e.name);
				if (foundEmotes.length === 0) {
					return undefined;
				}

				const input = ev.target as HTMLInputElement;

				if (input.value != this.tab.expectedValue) this.resetCursor();
				else if (input.selectionStart != this.tab.expectedCursorLocation) this.resetCursor();

				this.handleTabPress(ev, foundEmotes);
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
		const inputText = input.value;
		const cursorPosition = input.selectionStart || 0;

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
			this.app.sendMessageDown('SetChatInput', { message: newMessage, cursorPosition: newCursorPosition });
		}, 0);
	}
}

const startsWith = (prefix: string, emoteName: string): boolean =>
	emoteName.toLowerCase().startsWith(prefix.toLowerCase());
