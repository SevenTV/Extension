import { getChatController } from "@/site/twitch.tv";

export const maxVal = 300.0;
const minVal = 40.0;
const delVal = 80.0;
const maxSeconds = 1209600.0;

const controller = getChatController();

export function shouldModerate(msg: Twitch.ChatMessage) {
	return (
		(controller?.props.isCurrentUserModerator &&
			msg.badges &&
			!("moderator" in msg.badges) &&
			!("broadcaster" in msg.badges) &&
			!("staff" in msg.badges)) ??
		false
	);
}

export function executeModAction(message: string, name: string, id: string) {
	controller?.sendMessage(message.replace("{user}", name).replace("{id}", id));
}

export function numberToTime(val: number): string {
	if (val < 60) {
		return `${Math.round(val)} seconds`;
	} else if (val < 60 * 60) {
		return `${Math.round(val / 60)} minutes`;
	} else if (val < 60 * 60 * 24) {
		return `${Math.round(val / (60 * 60))} hours`;
	} else {
		return `${Math.round(val / (60 * 60 * 24))} days`;
	}
}

export class sliderData {
	command = "";
	text = "";
	time = 0;
	banVis = 0;
	unbanVis = 0;
	color = "";
	pos = "0px";

	constructor(pos: number) {
		this.pos = `${pos}px`;

		if (pos < -40) {
			this.command = "/unban {user}";
			this.unbanVis = 1;
		} else if (pos < minVal) {
			return;
		} else if (pos < delVal) {
			this.command = "/delete {id}";
			this.text = "Delete";
			this.color = "#FFFF00";
			this.banVis = 1;
		} else if (pos < maxVal) {
			const time = Math.pow((pos + 0.25 * maxVal - delVal) / (1.25 * maxVal - delVal), 10) * maxSeconds;

			this.command = `/timeout {user} ${Math.round(time)}`;
			this.text = String(numberToTime(time));
			this.color = "#FFA500";
			this.banVis = 1;
		} else {
			this.command = "/ban {user}";
			this.text = "Ban";
			this.color = "#C40000";
			this.banVis = 1;
		}
	}
}
