import { Subject } from 'rxjs';
import { Twitch } from 'src/Page/Util/Twitch';
import ReactDOM from 'react-dom';
import React from 'react';
import { ChatInput } from 'src/Page/Components/ChatInput';
import { PageScript } from 'src/Page/Page';
import { Logger } from 'src/Logger';

export class TabCompletion {
	private twitch = new Twitch();
	onInputEvent = new Subject<KeyboardEvent>();

	tab = {
		index: 0,
		entry: ''
	};

	constructor(private page: PageScript) { }

	/**
	 * Listen to keyboard inputs
	 */
	listen(): void {
		const input = this.getInput();
		if (!input) throw Error('Chat Text Input not found!');

		Logger.Get().info(`Handling tab completion`);

		const emotes = this.page.emoteStore.getAllEmotes(['7TV', 'BTTV', 'FFZ']);
		input.onkeydown = (ev) => {
			if (ev.key === 'Tab') {
				ev.preventDefault();

				this.handleTabPress(emotes.map(e => e.name));
			}

			setTimeout(() => this.onInputEvent.next(ev), 0);
		};
	}

	private handleTabPress(emotes: string[]): void {
		const input = this.getInput();
		const currentWord = input.value.match(/\b(\w+)\W*$/)?.[0];
		if (!currentWord) return undefined;

		const entries = emotes.filter(e => startsWith(currentWord ?? '', e));
		if (this.tab.entry !== currentWord) {
			this.tab.entry = currentWord;
			this.tab.index = -1;
		}
		this.tab.index >= (entries.length - 1) ? this.tab.index = 0 : this.tab.index++;

		const next = entries[this.tab.index];
		if (!next) return undefined;

		this.setInputValue(input.value.replace(currentWord, next));
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
}

const startsWith = (prefix: string, emoteName: string): boolean =>
	emoteName.toLowerCase().startsWith(prefix.toLowerCase());
