import { App } from 'src/Content/App/App';
import { Logger } from 'src/Logger';
import { Twitch } from 'src/Page/Util/Twitch';

export class TabCompleteDetection {
	tab = {
		index: 0,
		cursor: ''
	};

	constructor(public app: App) {}

	getInput(): HTMLInputElement {
		return document.querySelector(Twitch.Selectors.ChatInput) as HTMLInputElement;
	}

	/**
	 * Start the tab completion
	 */
	start(): void {
		Logger.Get().info('Handling tab completion');
		const input = this.getInput();
		const emotes = this.app.emoteStore.getAllEmotes(['7TV', 'BTTV', 'FFZ']);
		input.addEventListener('keydown', (ev) => {
			if (ev.key === 'Tab') {
				const foundEmotes = emotes.map(e => e.name);
				if (foundEmotes.length === 0) {
					return undefined;
				}

				this.handleTabPress(ev, foundEmotes);
			} else if (ev.code === 'Space' || ev.code === 'Backspace' || ev.code === 'Enter') { // Reset the cursor when the user is done typing an emote
				this.resetCursor();
			}
		}, {
			capture: false
		});
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
}

const startsWith = (prefix: string, emoteName: string): boolean =>
	emoteName.toLowerCase().startsWith(prefix.toLowerCase());
