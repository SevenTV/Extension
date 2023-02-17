import intervalToDuration from "date-fns/fp/intervalToDuration";

export const maxVal = 300.0;
const minVal = 40.0;
const delVal = 80.0;
const maxSeconds = 1209600.0;

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

export class ModSliderData {
	command: "unban" | "ban" | "delete" | "" = "";
	banDuration: string | null = null;
	text = "";
	time = 0;
	banVis = 0;
	unbanVis = 0;
	color = "";
	pos = "0px";

	constructor(private isActor = false) {}

	secondsToBanDuration(time: number): string {
		const duration = intervalToDuration({ start: 0, end: time * 1000 });
		return "".concat(
			duration.days ? `${duration.days}d` : "",
			duration.hours ? `${duration.hours}h` : "",
			duration.minutes ? `${duration.minutes}m` : "",
		);
	}

	calculate(pos: number): void {
		this.pos = `${this.isActor ? Math.max(0, pos) : pos}px`;

		if (pos < -40 && !this.isActor) {
			this.command = "unban";
			this.unbanVis = 1;
		} else if (pos < minVal) {
			return;
		} else if (pos < delVal) {
			this.command = "delete";
			this.text = "Delete";
			this.color = "#FFFF00";
			this.banVis = 1;
		} else if (pos < maxVal && !this.isActor) {
			const time = Math.pow((pos + 0.25 * maxVal - delVal) / (1.25 * maxVal - delVal), 10) * maxSeconds;

			this.command = "ban";
			this.banDuration = this.secondsToBanDuration(Math.round(time)) || "14d";
			this.text = String(numberToTime(time));
			this.color = "#FFA500";
			this.banVis = 1;
		} else if (pos >= maxVal && !this.isActor) {
			this.command = "ban";
			this.banDuration = null;
			this.text = "Ban";
			this.color = "#C40000";
			this.banVis = 1;
		}
	}
}
