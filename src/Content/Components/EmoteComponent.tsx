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
			<div style={{ display: 'inline-block' }}>
				<Tooltip enterDelay={0} title={
					<React.Fragment>
						<Emote.TooltipImage>
							<img src={this.props.url + '3x'}></img>
						</Emote.TooltipImage>

						<Emote.Details>
							<h3 className='emote-name'> {this.props.emote.name} </h3>
							<span className='emote-submitter'> by {this.props.emote.owner_name} </span>

							<h4> 7TV {this.props.emote.global ? 'Global' : 'Channel'} Emote </h4>
						</Emote.Details>
					</React.Fragment>
				} arrow interactive placement='left-start'>
					<Emote.Style
						className='seventv-emote'
						onClick={(ev: React.MouseEvent) => this.openDetails(ev)}
					>
						<img alt={this.props.name} className='chat-image chat-line__message--emote' src={this.props.url + '1x'} />
					</Emote.Style>
				</Tooltip>
			</div>
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
