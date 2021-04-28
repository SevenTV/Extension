import * as React from 'react';
import { Main } from 'src/Content/Components/MainComponent';
import { EmoteStore } from 'src/Global/EmoteStore';
import styled from 'styled-components';

export class EmoteComponent extends React.PureComponent<EmoteComponent.Props, EmoteComponent.State> {
	state = {
		details: {
			visible: false,
			posX: 0,
			posY: 0
		},
		hover: false
	};

	render() {
		return (
			<EmoteComponent.Container className='7tv-emote' onMouseLeave={ev => this.onMouseEvent(false, ev)} onMouseEnter={ev => this.onMouseEvent(true, ev)}>
					<EmoteComponent.Style
						className='seventv-emote'
						onClick={(ev: React.MouseEvent) => this.openDetails(ev)}
					>
						<img alt={this.props.emote.name} height={this.props.provider === 'emoji' ? 19.5 : ''} className='chat-image chat-line__message--emote' src={this.props.emote.cdn('1x')} />
					</EmoteComponent.Style>
			</EmoteComponent.Container>
		);
	}

	getURL(): string {
		return ``;
	}

	onMouseEvent(hover: boolean, event: React.MouseEvent): void {
		Main.ShowTooltip.next({ event, emote: this, hover });
	}

	openDetails(ev: React.MouseEvent) {
		this.setState({
			details: {
				posX: ev.clientX,
				posY: ev.clientY,
				visible: true
			}
		});
	}
}

export namespace EmoteComponent {
	export interface Props {
		provider?: string | undefined | null;
		emote: EmoteStore.Emote;
	}

	export interface State {
		details: {
			visible: boolean;
			posX: number;
			posY: number;
		};
		hover: boolean;
	}

	export const Container = styled.div`
		display: inline-block;
		padding-bottom: 4px;
		padding-top: 4px;
	`;

	export const Style = styled.div`

	`;

	export const TooltipImage = styled.div`
		margin: 1em;

		display: flex;
		justify-content: center;
	`;

	export const Details = styled.div`
		display: block;

		.emote-name {
			width: 100%;
			margin-bottom: 6px;
		}

		.emote-submitter {
			font-size: 2em;
		}

		.is-7tv-emote {
			font-size: 1.6em;
		}
	`;
}
