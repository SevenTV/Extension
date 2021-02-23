import { Injectable } from '@angular/core';
import * as Color from 'color';
import { Subject } from 'rxjs';

@Injectable({
	providedIn: 'root'
})

export class ThemingService {
	themeChanged = new Subject<string>();
	defaultTheme: ThemingService.Name = localStorage.getItem('theme') as ThemingService.Name || 'dark';
	dark = false;
	currentTheme: ThemingService.Name = 'dark';

	colors = {
		primary: {
			dark: '#0288D1',
			light: '#29B6F6',
			_env: {
				stage: '#20C94F',
				dev: '#C92B20'
			},
			get: () => new Color(this.colors.primary[this.currentTheme])
		},
		warning: {
			dark: '#f44336',
			light: '#f44336',
			get: () => new Color(this.colors.warning[this.currentTheme])
		},
		accent: {
			dark: '#b2ff59',
			light: '#69f0ae',
			get: () => new Color(this.colors.accent[this.currentTheme])
		},
		bg: {
			dark: '#303030',
			light: '#fafafa',
			get: () => new Color(this.colors.bg[this.currentTheme])
		},

		twitch_purple: new Color('#9146FF')
	};

	images = {

	};

	constructor() {}

	get bg(): Color {
		return this.colors.bg.get();
	}

	get warning(): Color {
		return this.colors.warning.get();
	}

	get primary(): Color {
		return this.colors.primary.get();
	}

	get accent(): Color {
		return this.colors.accent.get();
	}
}

export namespace ThemingService {
	export type Name = 'dark' | 'light';
}
