import { Theme, Tooltip, withStyles } from '@material-ui/core';
import React from 'react';
import { Twitch } from 'src/Page/Util/Twitch';

const BadgeTooltip = withStyles((theme: Theme) => ({
	tooltip: {
		fontSize: '1em',
		padding: '.4em'
	}
}))(Tooltip);

export class Badge extends React.Component<Badge.Props> {
	render() {

		return (
			<BadgeTooltip title={this.props.badge.title} enterDelay={0} leaveDelay={0} placement='top-start' TransitionProps={{ timeout: 50 }}>
				<img
					alt={this.props.badge.title}
					aria-label={this.props.badge.title + ' Badge'}
					className='chat-badge'
					src={this.props.badge.image1x}>
				</img>
			</BadgeTooltip>
		);
	}
}

export namespace Badge {
	export interface Props {
		badge: Twitch.ChatBadge;
	}
}
