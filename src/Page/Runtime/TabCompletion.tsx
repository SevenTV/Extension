import { Observable, throwError } from "rxjs";
import { Page } from "src/Page/Page";
import { MessagePatcher } from "src/Page/Util/MessagePatcher";
import { Twitch } from "src/Page/Util/Twitch";
import { Config } from "src/Config";

export class TabCompletion {
	private twitch = new Twitch();

	constructor() {
		this.listen().subscribe();
	}

	/**
	 * Listen to keyboard inputs
	 */
	listen(): Observable<KeyboardEvent> {
		const input = this.getInput();
		if (!input) return throwError(Error("Chat Text Input not found!"));

		return new Observable<KeyboardEvent>((observer) => {
			input.onkeydown = (ev) => {
				observer.next(ev);

				if (ev.code === "Space") {
					this.createPreview();
				}
			};
		});
	}

	/**
	 * Create a preview of the current text input with emotes
	 */
	createPreview(): void {
		const input = this.getInput();
		const container = document.querySelector(Twitch.Selectors.ChatInputButtonsContainer)?.firstChild as HTMLDivElement;
		if (!container) return undefined;

		// Split words
		const emotes = MessagePatcher.getRegexp();
		const matches = input.value.match(emotes);
		if (!matches) return undefined;

		container.innerHTML = "";
		container.style.alignItems = "center";
		container.style.flexWrap = "wrap";
		for (const match of matches) {
			// Add emotes/text to preview
			const emote = Page.EmoteSet.find((e) => e.name === match);
			if (emote) {
				const img = document.createElement("img");
				img.src = `${Config.cdnUrl}/emote/${emote?._id}/1x`;
				img.title = emote.name;
				img.alt = emote.name;
				// ReactDOM.render(<Emote name={emote.name} provider='7TV' src={{ preview: '', small: `${Config.cdnUrl}/emote/${emote?._id}/1x` }} ownerName={emote.owner_name} />, img);
				container?.appendChild(img);
			} else {
				container.appendChild(new Text(match + " "));
			}
		}
	}

	getInput(): HTMLInputElement {
		return document.querySelector(Twitch.Selectors.ChatInput) as HTMLInputElement;
	}

	setInputValue(value: string): void {
		const el = document.querySelector(Twitch.Selectors.ChatInput) as HTMLInputElement;
		el.value = value;
		el.dispatchEvent(new Event("input", { bubbles: true }));

		const inst = this.twitch.getReactInstance(el) as Twitch.TwitchPureComponent;

		if (inst) {
			const props = inst.memoizedProps;
			if (props && props.onChange) {
				props.onChange({ target: el });
			}
		}
	}
}
