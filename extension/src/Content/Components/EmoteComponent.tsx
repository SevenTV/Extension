import Tooltip from '@material-ui/core/Tooltip';
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
				<Tooltip title={<h1 style={{ fontSize: '2.5em' }}>{this.props.name + ' (7TV Emote)'}</h1>} arrow>
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
	}

	export interface State {
		details: {
			visible: boolean;
			posX: number;
			posY: number;
		};
	}

	export const Wrapper = styled.div`

	`;
	export const Style = styled.div`
		display: 'inline-flex';
	`;
}
