import { dev_version, displayName as name, version as packagedVersion } from "./package.json";
import path from "path";

export const r = (...args: string[]) => path.resolve(__dirname, ...args);

export const appName = name;
export const version = packagedVersion;
export const getFullVersion = (nightly?: boolean, stage?: boolean) => {
	let v = version;
	if (stage) {
		v += "-dev-" + Date.now().toString();
	} else if (nightly) {
		v += "." + (parseFloat(dev_version) * 1000).toFixed(0);
	}
	return v;
};

const versionSplit = version.split(".");
export const versionID =
	versionSplit.slice(0, 3).join("") + (versionSplit[3] ? `-${parseInt(versionSplit[3]) / 1000}` : "");
