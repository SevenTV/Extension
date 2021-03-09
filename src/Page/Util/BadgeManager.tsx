import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Badge } from 'src/Page/Components/Badge';
import { Twitch } from 'src/Page/Util/Twitch';


export class BadgeManager {
	twitch = new Twitch();

	badgeList = [
		{
			id: '7TV#DEVELOPER',
			image1x: 'https://cdn.7tv.app/badge/developer/1x',
			image2x: 'https://cdn.7tv.app/badge/developer/2x',
			image4x: 'https://cdn.7tv.app/badge/developer/3x',
			setID: '7tv',
			title: '7TV Developer',
			version: '1',
			__typename: 'Badge'
		}
	] as Twitch.ChatBadge[];

	constructor() {

	}

	patchChatLine(line: Twitch.ChatLineAndComponent): void {
		const { element, component } = line;
		const badge = this.badgeList[0];

		// Write 7tv-badges container
		const container = document.createElement('span');
		container.id = '7tv-badges';
		container.classList.add('7tv-badge-list');
		ReactDOM.render(<Badge badge={badge} />, container);

		const usernameContainer = element.querySelectorAll(Twitch.Selectors.ChatUsernameContainer).item(0);
		const ffzBadgeList = element.querySelectorAll(Twitch.Selectors.ChatMessageBadges).item(0);

		// Render badge normally
		if (!!usernameContainer) {
			const beforeElement = usernameContainer.firstChild?.nextSibling;
			if (!!beforeElement) usernameContainer?.insertBefore(container, beforeElement);
		} else if (!!ffzBadgeList) { // Or handle FFZ's fuckery of reinventing the wheel for everything pepeAgony
			ffzBadgeList.appendChild(container);
		}
	}
}
