import * as React from 'react';
import { Content } from 'src/Content/Content';
import styled from 'styled-components';

export class Emote extends React.PureComponent<Emote.Props, Emote.State> {
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
			<Emote.Container className='7tv-emote' style={{ display: 'inline-block' }} onMouseLeave={ev => this.onMouseEvent(false, ev)} onMouseEnter={ev => this.onMouseEvent(true, ev)}>
					<Emote.Style
						className='seventv-emote'
						onClick={(ev: React.MouseEvent) => this.openDetails(ev)}
					>
						<img alt={this.props.name} height={this.props.provider === 'emoji' ? 19.5 : ''} className='chat-image chat-line__message--emote' src={this.props?.src.small} />
					</Emote.Style>
			</Emote.Container>
		);
	}

	getURL(): string {
		return ``;
	}

	onMouseEvent(hover: boolean, event: React.MouseEvent): void {
		Content.ShowTooltip.next({ event, emote: this, hover });
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

export namespace Emote {
	export interface Props {
		provider?: string | undefined | null;
		src: {
			small: string;
			preview: string;
		};
		name: string;
		ownerName?: string;
		global?: boolean;
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
		display: 'inline-block';
		padding-bottom: 4px;
		padding-top: 4px;
	`;

	export const Style = styled.div`
		display: 'inline-flex';
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
