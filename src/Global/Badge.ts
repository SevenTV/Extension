import { MainComponent } from 'src/Content/Components/MainComponent';


export class Badge {
	id: string;
	name: string;
	tooltip: string;
	misc: boolean;
	users: string[];
	urls: [string, string][];

	constructor(private data: Badge.Data) {
		this.id = this.data.id ?? '';
		this.name = data.name ?? '';
		this.tooltip = data.tooltip ?? '';
		this.misc = data.misc || false;
		this.users = Array.isArray(data.users) ? data.users : [];
		this.urls = Array.isArray(data.urls) ? data.urls : [];
	}

	/**
	 * Get the URL to this badge
	 *
	 * @param size the size of the badge to return
	 */
	cdn(size: '1' | '2' | '3'): string {
		const url = this.urls.filter(([s]) => s === size)?.[0] ?? this.urls[this.urls.length - 1];

		return url[1];
	}

	toElement(): HTMLButtonElement {
		const button = document.createElement('button');
		const img = document.createElement('img');
		button.setAttribute('data-a-target', 'chat-badge');
		img.alt = this.tooltip;
		img.classList.add('chat-badge');
		img.src = this.cdn('1');
		img.srcset = `${this.cdn('1')} 1x, ${this.cdn('2')} 2x, ${this.cdn('3')} 3x`;
		button.addEventListener('mouseenter', event => {
			MainComponent.ShowTooltip.next({ event, hover: true, fields: {
				name: this.name,
				hint: this.tooltip,
				imageURL: this.cdn('3')
			}});
		});
		button.addEventListener('mouseleave', event => {
			MainComponent.ShowTooltip.next({ event, hover: false });
		});

		button.appendChild(img);
		return button;
	}

}

export namespace Badge {
	export interface Data {
		id: string;
		tooltip: string;
		name: string;
		misc?: boolean;
		users: string[];
		urls: [string, string][];
	}
}

/*

<img alt="Broadcaster" aria-label="Broadcaster badge" class="chat-badge"
	src="https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1"
	srcset="https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1 1x, https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2 2x, https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3 4x">

*/
