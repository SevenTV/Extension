import * as React from 'react';

export class Emote extends React.Component<Emote.Props> {

	render() {
		return (
			<div style={{ display: 'inline-block' }} title={this.props.name + " (7TV Emote)"} className="7tv-emote chat-line__message--emote-button" >
				<img className="chat-image chat-line__message--emote" src={this.props.url} />
			</div>
		);
	}
}

export namespace Emote {
	export interface Props {
		name: string;
		url: string;
	}
}
