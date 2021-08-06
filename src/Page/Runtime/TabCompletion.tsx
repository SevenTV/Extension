import { Twitch } from 'src/Page/Util/Twitch';
import { Logger } from 'src/Logger';

export class TabCompletion {
	private twitch = new Twitch();

	tab = {
		index: 0,
		entry: ''
	};

	constructor() { }

	/**
	 * Listen to keyboard inputs
	 */
	listen(): void {
		const input = this.getInput();
		if (!input) throw Error('Chat Text Input not found!');

		Logger.Get().info(`Handling tab completion`);

		const sendMessage = this.twitch.getChatController().props.chatConnectionAPI.sendMessage;
		if (!sendMessage) {
			throw new Error('can\'t send message: service unavailable');
		}

		// Event: Virtual Input Sent
		input.addEventListener('seventv:virtualsend', ev => {
			sendMessage((ev as CustomEvent).detail);
		})
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
