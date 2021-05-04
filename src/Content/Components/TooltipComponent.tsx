import React from 'react';
import { EmoteComponent } from 'src/Content/Components/EmoteComponent';
import styled from 'styled-components';


export class TooltipComponent extends React.Component<TooltipComponent.Props, TooltipComponent.State> {
	ref = React.createRef<any>();
	state = {
		refWidth: 0,
		refHeight: 0
	} as TooltipComponent.State;

	render() {
		return (
			<div ref={this.ref} className='seventv-emote-tooltip' style={{ position: 'relative', top: (this.getPosY() - 74), left: this.getPosX() - 74 }}>
				<TooltipComponent.Image>
					<img src={this.emoteProps.emote.cdn('3')}></img>
				</TooltipComponent.Image>

				<TooltipComponent.Details>
					<h3 className='emote-name'> {this.emoteProps.emote.name} </h3>
					{!!this.emoteProps.emote.owner?.display_name ? <span className='emote-submitter'> by {this.emoteProps.emote.owner.display_name} </span> : ''}

					{this.emoteProps.emote.isGlobal() && <p className='is-7tv-global'>Global Emote</p>}
				</TooltipComponent.Details>
				<TooltipComponent.Provider>
					{this.emoteProps.emote.provider === '7TV'
						? <img width={32} src='https://7tv.app/assets/brand/7tv-light.svg' /> // TODO: don't hardcode this
						: <span> { this.emoteProps.emote.provider.toUpperCase() } </span>
					}
				</TooltipComponent.Provider>
			</div>
		);
	}

	getPosY(): number {
		return this.props.posY - 120;
	}

	getPosX(): number {
		const maxWidth = (document.getElementsByClassName('stream-chat').item(0) as HTMLDivElement)?.scrollWidth ?? window.innerWidth;
		const offset = (this.state.refWidth - maxWidth) + this.state.refWidth;

		if ((this.state.refWidth + offset) > maxWidth) {
			return Math.max(offset, this.props.posX - offset);
		} else {
			return this.props.posX;
		}
	}

	componentDidMount(): void {
	}

	get emoteProps(): EmoteComponent.Props {
		return this.props.emote.props;
	}
}

export namespace TooltipComponent {
	export interface State {
		refWidth: 0;
		refHeight: 0;
	}

	export interface Props {
		emote: EmoteComponent;
		posX: number;
		posY: number;
	}

	export const EmoteTitle = styled.h3`
		padding: .5em;
	`;

	export const Image = styled.div`
		margin: 1em;

		display: flex;
		justify-content: center;
	`;

	export const Details = styled.div`
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 1em;

		.emote-name {
			width: 100%;
			margin-bottom: 1px;
		}

		.emote-submitter {
			font-size: .85em;
		}

		.is-7tv-emote {
			font-size: 1.6em;
		}

		.is-7tv-global {
			width: 100%;
			color: #b2ff59;
		}
	`;

	export const Provider = styled.div`
		position: absolute;
		bottom: 0;
		right: 0;
		margin: .4em;
	`;
}
