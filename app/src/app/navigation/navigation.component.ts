import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { ThemingService } from 'src/app/service/theming.service';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-navigation',
	templateUrl: './navigation.component.html',
	styleUrls: ['navigation.component.scss']
})
export class NavigationComponent implements OnInit {
	envName: ('dev' | 'stage') = 'dev';

	// List of navigation buttons which appear
	// on the right side of the toolbar
	navButtons = [
		{
			name: 'home',
			path: '/',
			icon: 'home'
		},
		{
			name: 'about',
			path: '/about',
			icon: 'info'
		},
		{
			name: 'emotes',
			path: '/emotes',
			icon: 'emoji_emotions'
		}
	] as NavigationComponent.NavButton[];

	constructor(
		private router: Router,
		public themingService: ThemingService,
		public appService: AppService
	) { }

	/**
	 * Whether the current environment is production
	 */
	get isEnvironmentProd(): boolean {
		return environment.name === 'prod';
	}

	ngOnInit(): void {}

}

export namespace NavigationComponent {
	export interface NavButton {
		name: string;
		icon: string;
		path: string;
		selected?: boolean;
	}
}
