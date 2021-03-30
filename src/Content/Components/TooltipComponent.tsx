import React from 'react';
import { Emote } from 'src/Page/Components/EmoteComponent';
import styled from 'styled-components';


export class TooltipComponent extends React.Component<TooltipComponent.Props> {
	render() {
		return (
			<div className='seventv-emote-tooltip' style={{ position: 'relative', top: (this.props.posY - 74), left: this.props.posX }}>
				<TooltipComponent.Image>
					<img src={this.emoteProps.src.preview}></img>
				</TooltipComponent.Image>

				<TooltipComponent.Details>
					<h3 className='emote-name'> {this.emoteProps.name} </h3>
					{!!this.emoteProps.ownerName ? <span className='emote-submitter'> by {this.emoteProps.ownerName} </span> : ''}
				</TooltipComponent.Details>

				<TooltipComponent.Provider>
					{!!this.emoteProps.provider &&
						<span> {this.emoteProps.provider} {this.emoteProps.global ? 'Global' : ''} Emote </span>
					}
				</TooltipComponent.Provider>
			</div>
		);
	}

	get emoteProps(): Emote.Props {
		return this.props.emote.props;
	}
}

export namespace TooltipComponent {
	export interface Props {
		emote: Emote;
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
		display: block;
		margin-left: 1.25em;
		margin-bottom: 1em;

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
	`;

	export const Provider = styled.div`
		position: absolute;
		bottom: 0;
		right: 0;
		margin: .4em;
	`;
}
