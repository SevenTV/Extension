export class Logger {
	private static instance: Logger;
	static Get(): Logger {
		return this.instance ?? (Logger.instance = new Logger());
	}

	private ctx = "context unset";

	private getPrefix() {
		return {
			text: "%c[7TV]",
			css: "color:#ef9234;",
		};
	}

	private print(type: "error" | "warn" | "debug" | "info", text: string[], extraCSS: string[]): void {
		const prefix = this.getPrefix();
		console[type](prefix.text + " " + text.join(" ") + ` (${this.ctx})`, prefix.css, ...extraCSS);
	}

	setContextName(name: string): void {
		this.ctx = name;
	}

	debug(...text: string[]): void {
		return this.print("debug", ["%c[DEBUG]%c", ...text], ["color:#32c8e6;", "color:grey"]);
	}

	info(...text: string[]): void {
		return this.print("info", ["%c[INFO]%c", ...text], ["color:#3cf051;", "color:reset;"]);
	}

	warn(...text: string[]): void {
		return this.print("warn", ["%c[WARN]%c", ...text], ["color:#fac837;", "color:reset;"]);
	}

	error(...text: string[]): void {
		return this.print("error", ["%c[ERROR]%c", ...text], ["color:#e63232;", "color:reset;"]);
	}
}

export const log = new Logger();
