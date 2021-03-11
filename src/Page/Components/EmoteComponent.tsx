import Tooltip from '@material-ui/core/Tooltip';
import { DataStructure } from '@typings/typings/DataStructure';
import * as React from 'react';
import styled from 'styled-components';

export class Emote extends React.Component<Emote.Props, Emote.State> {
	state = {
		details: {
			visible: false,
			posX: 0,
			posY: 0
		}
	};

	render() {
		return (
			<Emote.Container className='7tv-emote' style={{ display: 'inline-block' }}>
				<Tooltip enterDelay={0} TransitionProps={{ timeout: 50 }} title={
					<React.Fragment>
						<Emote.TooltipImage>
							<img src={this.props?.src.preview}></img>
						</Emote.TooltipImage>

						<Emote.Details>
							<h3 className='emote-name'> {this.props.name} </h3>
							<span className='emote-submitter'> by {this.props.ownerName ?? 'Unknown Submitter'} </span>

							<h4> {this.props.provider} {this.props.global ? 'Global' : 'Channel'} Emote </h4>
						</Emote.Details>
					</React.Fragment>
				} arrow placement='left-start'>
					<Emote.Style
						className='seventv-emote'
						onClick={(ev: React.MouseEvent) => this.openDetails(ev)}
					>
						<img alt={this.props.name} className='chat-image chat-line__message--emote' src={this.props?.src.small} />
					</Emote.Style>
				</Tooltip>
			</Emote.Container>
		);
	}

	getURL(): string {
		return ``;
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
		provider: string;
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
	}

	export const Container = styled.div`
		display: 'inline-block';
		margin-bottom: 10px;
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
