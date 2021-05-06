import React from 'react';
import ReactDOM from 'react-dom';
import { EmoteComponent } from 'src/Content/Components/EmoteComponent';
import { getProviderLogo } from 'src/Global/Util';
import styled from 'styled-components';

export class TooltipComponent extends React.Component<TooltipComponent.Props, TooltipComponent.State> {
	ref = React.createRef<any>();
	state = {
		refWidth: 0,
		refHeight: 0,
		node: null
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
					{this.emoteProps.emote.provider === 'EMOJI' && <p>Emoji</p>}
				</TooltipComponent.Details>
				<TooltipComponent.Provider>
					<img src={getProviderLogo(this.emoteProps.emote.provider)} />
				</TooltipComponent.Provider>
			</div>
		);
	}

	getPosY(): number {
		const h = (this.state.node?.clientHeight ?? 0);

		return (this.props.posY - (h / 1.35));
	}

	getPosX(): number {
		const w = (this.state.node?.clientWidth ?? 0);

		const maxWidth = (document.getElementsByClassName('stream-chat').item(0) as HTMLDivElement)?.scrollWidth ?? window.innerWidth;
		const mostX = this.props.posX - (window.innerWidth - maxWidth) + w;

		return mostX > maxWidth ? (this.props.posX - (mostX - maxWidth) + 32) : this.props.posX;
	}

	componentDidMount(): void {
		setTimeout(() => {
			let node: Element | null = null;
			try {
				node = ReactDOM.findDOMNode(this) as Element;
			} catch (_) { }

			this.setState({
				node
			});
		}, 0);
	}

	componentWillUnmount(): void {
		this.state.node = null;
	}

	get emoteProps(): EmoteComponent.Props {
		return this.props.emote.props;
	}
}

export namespace TooltipComponent {
	export interface State {
		refWidth: 0;
		refHeight: 0;
		node: Element | null;
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
		padding-right: 3em;
		max-width: 270px;

		.emote-name {
			width: 100%;
			margin-bottom: 1px;
			word-wrap: break-word;
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
		padding-left: 32px;

		img {
			max-width: 28px;
		}
	`;
}
