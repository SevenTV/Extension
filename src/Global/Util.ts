import { DataStructure } from '@typings/typings/DataStructure';
import { Config } from 'src/Config';
import Color from 'color';
import { createMuiTheme } from '@material-ui/core';

export function getRunningContext(): Context {
	try {
		if (!!chrome?.extension?.getBackgroundPage) {
			return 'background';
		}
		else if (typeof chrome.runtime.id !== 'undefined') {
			return 'content';
		} else {
			return 'page';
		}
	}
	catch (_) {
		return 'content';
	}
}

export function sendExtensionMessage(tag: string, data: any, callback?: ((response: any) => void)): void {
	chrome.runtime.sendMessage({
		tag,
		data
	}, callback);
}

type Context = 'background' | 'content' | 'page';

export interface ExtensionRuntimeMessage<T = any> {
	tag: string;
	data: T;
}

export const Colors = {
	Primary: Color('#0288D1'),
	Accent: Color('#b2ff59'),
	Warning: Color('#f44336'),
	Background: Color('#303030')
};

export const theme = createMuiTheme({
	palette: {
		primary: {
			main: '#4dabf5',
			dark: '#1769aa',
			light: '#2196f3',
			contrastText: '#fff',
		},
		secondary: {
			main: '#ffb851',
			light: '#ffa726',
			dark: '#b2741a'
		},
		success: {
			main: '#33eb91',
			dark: '#00a152',
			light: '#00e676'
		},
		error: {
			main: '#f27573',
			dark: '#a73a38',
			light: '#ef5350'
		},
		background: {
			default: '#303030',
			paper: '#303030'
		},
		text: {
			primary: '#fff'
		},
		common: {
			white: '#fff',
			black: '#000'
		},
		info: {
			dark: '#fff',
			light: '#fff',
			main: '#fff'
		}
	},
});

/**
 * @returns the cdn url to a provider's logo
 */
export function getProviderLogo(provider: DataStructure.Emote.Provider): string {
	let value = Config.cdnUrl;
	switch (provider) {
		case '7TV':
			value += '/misc/7tv-d.webp';
			break;
		case 'BTTV':
			value += '/misc/bttv.webp';
			break;
		case 'FFZ':
			value += '/misc/ffz.webp';
			break;
		case 'TWITCH':
			value += '/misc/twitch.webp';
			break;
		default:
			value += '/misc/7tv-q.webp';
			break;
	}

	return value;
}
