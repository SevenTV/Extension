import { YouTube } from 'src/Sites/youtube.com/Util/YouTube';

export class YouTubePageScript {
	youtube = (window as any).yt = new YouTube();

	constructor() {
		const currentLocation = document.location.href;
		setInterval(() => {
			if (currentLocation !== document.location.href) {
				this.handleNavigationChange();
			}
		}, 500);

		setTimeout(() => {
			this.handleNavigationChange();
		}, 1000);
	}

	handleNavigationChange(): void {
		// Try to find the chat
		const chatContainer = this.youtube.getChatContainer();
		console.log('chat container', chatContainer);
	}
}

let page: YouTubePageScript;
(() => {
	const { } = page = new YouTubePageScript();
})();
console.log('YT', page);
