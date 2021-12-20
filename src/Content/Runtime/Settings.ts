import { Subject } from 'rxjs';
import { getRunningContext, SettingValue } from 'src/Global/Util';

declare var browser: any;
class Settings {
	ctx = getRunningContext();
	change = new Subject<{ [x: string]: any }>();

	raw = {} as { [x: string]: any };
	data = new Map<string, any>();
	nodes = [] as SettingNode[];

	constructor() {
		if (this.ctx === 'content') {
			try {
				// Get config value & handle changes
				// Retrieve initial value
				chrome.storage.local.get(items => {
					const result = Object.create({});
					for (const k of Object.keys(items)) {
						const v = items[k];
						const name = k.slice(4);

						result[name] = v;
						this.data.set(name, v);
					}

					// Add default-valued settings
					for (const sNode of this.nodes) {
						if (typeof result[sNode.id] !== 'undefined') {
							continue;
						}

						result[sNode.id] = sNode.defaultValue;
					}

					this.raw = result;
					this.change.next(result);
				});

				// Handle changes
				chrome.storage.onChanged.addListener(changes => {
					for (const k of Object.keys(changes)) {
						const v = changes[k].newValue;
						const name = k.slice(4);
						if (typeof v === 'undefined') {
							this.data.delete(k.slice(4));
							continue;
						}

						this.raw[name] = changes[k].newValue;
						this.data.set(name, changes[k].newValue);
						this.change.next({ [name]: changes[k].newValue });
					}
				});
			} catch (err) {

			}

			// Check if the browser is firefox
			// This is used to disable some settings that are not available on that browser
			let isFirefox = false;
			try {
				isFirefox = !!browser;
			} catch (_) {

			}
			this.nodes.push(
				{
					id: 'general.hide_unlisted_emotes',
					label: 'Hide Unlisted Emotes',
					hint: 'If checked, emotes which have not yet been approved for listing on 7tv.app will be blurred',
					type: 'checkbox',
					defaultValue: false
				},
				{
					id: 'general.allow_send_twice',
					label: 'Allow sending the same message twice',
					hint: 'Bypass the "message is identical" notice by automatically appending an extra space at the end of your duplicate messages. This also allows you to hold Ctrl+Enter to rapid-fire send the same message.',
					type: 'checkbox',
					defaultValue: false
				},
				{
					id: 'general.display_mod_actions',
					label: 'Show Timeouts & Bans',
					hint: 'This setting allows non-moderators to see actions by moderators',
					type: 'checkbox',
					defaultValue: true
				},
				{
					id: 'general.autocomplete',
					label: 'Auto-Completion',
					hint: 'Enable or disable 7TV emote auto-completion',
					type: 'checkbox',
					defaultValue: true
				},
				{
					id: 'general.autocomplete_chatters',
					label: 'Auto-Complete Chatters',
					hint: 'Whether or not active chatters should be included in results for auto-completion',
					type: 'checkbox',
					defaultValue: true
				},
				{
					id: 'general.app_avatars',
					label: 'Animated Avatars',
					hint: 'Display custom 7TV avatars which may be animated',
					type: 'select',
					options: ['enabled', 'hover', 'disabled'],
					defaultValue: 'enabled'
				},
				{
					id: 'general.paints',
					label: 'Nametag Paints',
					hint: 'Display custom paints and effects on usernames in chat',
					type: 'checkbox',
					defaultValue: true
				},
				{
					id: 'general.history_navigation',
					label: 'History Navigation',
					hint: 'Allow the usage of up/down arrows to get previously sent messages back in the chat input box',
					type: 'checkbox',
					defaultValue: true
				},
				{
					id: 'ui.transparency',
					label: 'UI Transparency',
					hint: 'Toggle the transparency / backdrop blur' + (isFirefox ? ` (Unavailable on Firefox) ` : ''),
					type: 'checkbox',
					defaultValue: isFirefox ? false : true,
					disabledIf: () => isFirefox
				},
				{
					id: 'ui.minimize_tooltip_size',
					label: 'Minimize Tooltip Size',
					hint: 'Make the 7TV tooltips smaller',
					type: 'checkbox',
					defaultValue: false
				},
				{
					id: 'ui.hide_emote_menu',
					label: 'Hide the 7TV emote menu',
					hint: 'If checked, the 7TV emote menu located under the chat box will not be visible',
					type: 'checkbox',
					defaultValue: false
				}
				,
				{
					id: 'ui.show_moderation_slider',
					label: 'Show moderation slider',
					hint: 'If checked, the moderation slider will be visible in channels you moderate',
					type: 'checkbox',
					defaultValue: true
				}

			);
		}
	}

	get(name: string): SettingValue {
		let value = this.data.get(name);
		if (typeof value === 'undefined') {
			const sNode = this.nodes.filter(s => s.id === name)[0];
			if (!sNode) {
				return new SettingValue(undefined);
			}

			return new SettingValue(sNode.defaultValue);
		}

		return new SettingValue(value);
	}

	apply(items: { [x: string]: string; }): void {
		// Get all config k/v pairs
		const keys = Object.keys(items).filter(k => k.startsWith('cfg.'));

		// Iterate through available settings and apply stored value
		for (const sNode of this.nodes) {
			for (const k of keys) {
				if (k.slice(4) !== sNode.id) {
					continue;
				}
				const value = items[k];

				sNode.value = value;
				chrome.storage.local.set({ [`cfg.${sNode.id}`]: sNode.value });
				if (sNode.defaultValue === value) {
					chrome.storage.local.remove(`cfg.${sNode.id}`);
				}
			}
		}
	}
}

export interface SettingNode {
	id: string;
	label: string;
	hint?: string;
	type: SettingNode.Type;
	options?: string[];

	value?: boolean | string | object;
	defaultValue?: boolean | string | object;
	disabledIf?: () => boolean;
}
export namespace SettingNode {
	export type Type = 'select' | 'checkbox';
}

export const settings = new Settings();
