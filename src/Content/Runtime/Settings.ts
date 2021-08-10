import { Subject } from 'rxjs';
import { getRunningContext, SettingValue } from 'src/Global/Util';

class Settings {
	ctx = getRunningContext();
	change = new Subject<{ [x: string]: any }>();

	data = new Map<string, any>();
	nodes = [
		{
			id: 'general.hide_unlisted_emotes',
			label: 'Hide Unlisted Emotes',
			hint: 'If checked, emotes which have not yet been approved for listing on 7tv.app will be blurred',
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
			id: 'general.persistent_history',
			label: 'Persistent Chat History',
			hint: 'If enabled, your 100 most recent chat messages will persist in history (up-down arrow navigation)',
			type: 'checkbox',
			defaultValue: true
		},
		{
			id: 'ui.transparency',
			label: 'UI Transparency',
			hint: 'Toggle the transparency / backdrop blur ',
			type: 'checkbox',
			defaultValue: true
		},
		{
			id: 'ui.minimize_tooltip_size',
			label: 'Minimize Tooltip Size',
			hint: 'Make the 7TV tooltips smaller',
			type: 'checkbox',
			defaultValue: false
		}
	] as SettingNode[];

	constructor() {
		if (this.ctx === 'content') {
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

					this.data.set(name, changes[k].newValue);
					this.change.next({ [name]: changes[k].newValue });
				}
			});
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
}

export interface SettingNode {
	id: string;
	label: string;
	hint?: string;
	type: SettingNode.Type;

	value?: boolean | string | object;
	defaultValue?: boolean | string | object;
}
export namespace SettingNode {
	export type Type = 'checkbox';
}

export const settings = new Settings();
