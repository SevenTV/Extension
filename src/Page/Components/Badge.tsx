import React from "react";
import { Tooltip, withStyles } from "@material-ui/core";
import { Twitch } from "src/Page/Util/Twitch";

const BadgeTooltip = withStyles(() => ({
	tooltip: {
		fontSize: "1em",
		padding: ".4em",
	},
}))(Tooltip);

export function Badge(props: Badge.Props): JSX.Element {
	const { badge } = props;

	return (
		<BadgeTooltip title={badge.title} enterDelay={0} leaveDelay={0} placement="top-start" TransitionProps={{ timeout: 50 }}>
			<img alt={badge.title} aria-label={badge.title + " Badge"} className="chat-badge" src={badge.image1x}></img>
		</BadgeTooltip>
	);
}

export namespace Badge {
	export interface Props {
		badge: Twitch.ChatBadge;
	}
}
