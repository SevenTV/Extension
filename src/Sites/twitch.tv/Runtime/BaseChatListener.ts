import { Subject } from 'rxjs';
import { TwitchPageScript } from 'src/Sites/twitch.tv/twitch';


export abstract class BaseTwitchChatListener {
	/** Create a Twitch instance bound to this listener */
	protected twitch = this.page.twitch;

	protected killed = new Subject<void>();

	constructor(protected page: TwitchPageScript) {
		(window as any).twitch = this.twitch;
	}

	abstract start(): void;
	abstract listen(): void;
	abstract sendSystemMessage(message: string): void;

	kill(): void {
		this.killed.next(undefined);
		this.killed.complete();
	}
}
