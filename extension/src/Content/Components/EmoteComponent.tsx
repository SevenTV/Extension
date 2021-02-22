import Tooltip from '@material-ui/core/Tooltip';
import { DataStructure } from '@typings/DataStructure';
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
			<div style={{ display: 'inline-block' }}>
				<Tooltip title={
					<React.Fragment>
						<Emote.TooltipImage>
							<img src={this.props.url}></img>
						</Emote.TooltipImage>

						<Emote.Details>
							<h3 className='emote-name'> {this.props.emote.name} </h3>
							<span className='emote-submitter'> by {this.props.emote.submitted_by} </span>
						</Emote.Details>
					</React.Fragment>
				} arrow interactive>
					<Emote.Style
						className='seventv-emote'
						onClick={(ev: React.MouseEvent) => this.openDetails(ev)}
					>
						<img className='chat-image chat-line__message--emote' src={this.props.url} />
					</Emote.Style>
				</Tooltip>
			</div>
		);
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
		name: string;
		url: string;
		emote: DataStructure.Emote;
	}

	export interface State {
		details: {
			visible: boolean;
			posX: number;
			posY: number;
		};
	}

	export const Style = styled.div`
		display: 'inline-flex';
	`;

	export const TooltipImage = styled.div`
		margin: 1em;
		height: 16em;
		width: 16em;

		display: flex;
		justify-content: center;
		img {
			border: 1px solid ##dcdcdc
			border-radius: 4px;
			padding: 5px;
			width: 16em;
		}
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
