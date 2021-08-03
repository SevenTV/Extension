import React from 'react';
import ReactDOM from 'react-dom';
import { Main } from 'src/Content/Components/MainComponent';
import styled from 'styled-components';

export class TooltipComponent extends React.Component<TooltipComponent.Props, TooltipComponent.State> {
	unmounted = false;
	ref = React.createRef<any>();
	state = {
		refWidth: 0,
		refHeight: 0,
		node: null
	} as TooltipComponent.State;

	render() {
		return (
			<div ref={this.ref} className='seventv-emote-tooltip' style={{ position: 'relative', top: (this.getPosY() - 74), left: this.getPosX() - 74 }}>
				{!!this.props.imageURL && <TooltipComponent.Image>
					<img src={this.props.imageURL}></img>
				</TooltipComponent.Image>
				}

				<TooltipComponent.Details>
					<h3 className='item-name'> {this.props.name} </h3>
					{!!this.props.hint ? <span className='item-hint'>{this.props.hint}</span> : ''}

					{...this.props.extra ?? []}
				</TooltipComponent.Details>

				{!!this.props.providerIconURL &&
				<TooltipComponent.Provider>
					<img src={this.props.providerIconURL} />
				</TooltipComponent.Provider>
				}
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
			if (this.unmounted) {
				return undefined;
			}

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
		this.unmounted = true;
		this.state.node = null;
	}
}

export namespace TooltipComponent {
	export interface State {
		refWidth: 0;
		refHeight: 0;
		node: Element | null;
	}

	export interface Props extends Main.State.CurrentTooltip {
		[x: string]: any;
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
			color: currentColor;
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
