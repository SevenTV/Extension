import { Constants } from '@typings/src/Constants';
import { DataStructure } from '@typings/typings/DataStructure';
import { Subject } from 'rxjs';
import { emoteStore } from 'src/Sites/app/SiteApp';
import { TwitchPageScript } from 'src/Sites/twitch.tv/twitch';
import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';


export abstract class BaseTwitchChatListener {
	/** Create a Twitch instance bound to this listener */
	protected twitch = this.page.twitch;

	protected killed = new Subject<void>();

	constructor(protected page: TwitchPageScript) {
		(window as any).twitch = this.twitch;
	}

	abstract start(): void;
	abstract listen(): void;

	insertTwitchGlobalEmotesToSet(emoteSets: Twitch.TwitchEmoteSet[]): void {
		// Iterate through sets, and start adding to our twitch set
		const emotes = [] as DataStructure.Emote[];
		for (const twset of emoteSets) {
			for (const emote of twset.emotes) {
				emotes.push({
					id: emote.id,
					name: emote.token,
					visibility: 0,
					provider: 'TWITCH',
					status: Constants.Emotes.Status.LIVE,
					tags: [],
					width: [28, 56, 112, 112],
					height: [28, 56, 112, 112],
					owner: !!twset.owner ? {
						id: twset.owner.id,
						display_name: twset.owner.displayName,
						login: twset.owner.login
					} as DataStructure.TwitchUser : undefined
				});
			}
		}

		// Delete the twitch set if it already existed then recreate it
		if (emoteStore.sets.has('twitch')) {
			emoteStore.sets.delete('twitch');
		}
		emoteStore.enableSet(`twitch`, emotes);
	}

	kill(): void {
		this.killed.next(undefined);
		this.killed.complete();
	}
}
