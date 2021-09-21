import React from 'react';
import { MainComponent } from 'src/Sites/app/MainComponent';
import { Logger } from 'src/Logger';
import { assetStore } from 'src/Sites/app/SiteApp';

export class EmoteMenuButton extends React.Component<EmoteMenuButton.Props> {
	ref: React.RefObject<HTMLButtonElement>;

	constructor(props: EmoteMenuButton.Props) {
		super(props);

		this.ref = React.createRef();
	}

	render() {
		return (
			<div>
				<button ref={this.ref} onClick={ev => this.onClick(ev)}>
					<img height={20} src={assetStore.get('7tv-bl.webp')} />
				</button>
				<span className={this.props.toSettings? "tooltip-under" : "tooltip-over"}>
					{this.props.toSettings? "7TV Settings" : "7TV Emotes"}
				</span>
			</div>
		);
	}

	/**
	 * Called when the user clicks the button
	 */
	private onClick(ev: React.MouseEvent): void {
		ev.stopPropagation();
		if (this.props.toSettings) {
			Logger.Get().debug('EmoteMenuButton, action=onClick, to settings');
			this.props.main?.openSettings();
			return undefined;
		}

		const bounds = this.ref.current?.getBoundingClientRect();
		Logger.Get().debug(`EmoteMenuButton, action=onClick, bounds=(x: ${bounds?.x}, y: ${bounds?.y})`);
		this.props.main?.toggleEmoteMenu(bounds);
	}
}

export namespace EmoteMenuButton {
	export interface Props {
		main: MainComponent | null;
		toSettings?: boolean;
	}
}
