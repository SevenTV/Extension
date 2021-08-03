

import React from 'react';
import BaseButton from '@material-ui/core/ButtonBase';
import styled from 'styled-components';
import { MainComponent } from 'src/Content/Components/MainComponent';
import { Logger } from 'src/Logger';

export class EmoteMenuButton extends React.Component<EmoteMenuButton.Props> {
	ref: React.RefObject<HTMLButtonElement>;

	constructor(props: EmoteMenuButton.Props) {
		super(props);

		this.ref = React.createRef();
	}

	render() {
		return (
			<EmoteMenuButton.Styled ref={this.ref} title='7TV Emotes' onClick={() => this.onClick()} style={{ color: 'white' }}>
				<div style={{padding: '4px'}}>
					<img height={24} src={chrome.runtime.getURL('image/7tv-nd.webp')} />
				</div>
			</EmoteMenuButton.Styled>
		);
	}

	/**
	 * Called when the user clicks the button
	 */
	private onClick(): void {
		const bounds = this.ref.current?.getBoundingClientRect();
		Logger.Get().info(`EmoteMenuButton, action=onClick, bounds=(x: ${bounds?.x}, y: ${bounds?.y})`);

		this.props.main?.toggleEmoteMenu(bounds);
	}
}

export namespace EmoteMenuButton {
	export interface Props {
		main: MainComponent | null;
	}

	export const Styled = styled(BaseButton)`
		margin: .5em;

		&:hover {
			border-radius: 4px;
			background-color: var(--color-background-button-text-hover);
			color: var(--color-fill-button-icon-hover);
		}
	`;
}
