import React from 'react';
import ReactDOM from 'react-dom';
import { EmoteMenuButton } from 'src/Sites/app/EmoteMenu/EmoteMenuButton';
import { SiteApp } from 'src/Sites/app/SiteApp';

export class EmbeddedUI {
	/**
	 * Embedded UI manages user interface components embedded on the site
	 */
	constructor(private app: SiteApp) {}

	/**
	 * Add a button below the chat input box
	 */
	embedChatButton(parent: HTMLElement): void {
		// Add emote list button
		const buttons = parent;
		if (!!buttons && !!buttons.lastChild) {
			if (buttons.querySelector('.seventv-menu-button')) {
				return undefined;
			}

			const last = buttons.lastChild;
			const container = document.createElement('div');
			container.classList.add('seventv-menu-button');

			last.insertBefore(container, last.lastChild ?? null);

			ReactDOM.render(<EmoteMenuButton main={this.app.mainComponent} />, container);
		}
	}

	/**
	 * Add a button on the navigation bar
	 */
	embedNavButton(parent: HTMLElement): void {
		const buttons = parent?.firstChild?.lastChild;

		if (!!buttons) {			
			const container = document.createElement('div');
			container.classList.add('seventv-menu-button');
			container.style.marginLeft = '0.5rem';
			container.style.marginRight = '0.5rem';

			ReactDOM.render(<EmoteMenuButton toSettings={true} main={this.app.mainComponent} />, container);
			buttons.insertBefore(container, buttons.lastChild?.previousSibling ?? buttons);
			if (!!container.firstElementChild) {
				(container.firstElementChild as HTMLDivElement).style.width = '2.5em';
			}
		}
	}
}
