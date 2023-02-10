import { reactive } from "vue";
import { IBrowser, UAParser, UAParserInstance } from "ua-parser-js";

interface UserAgentHelper {
	agent: UAParserInstance;
	browser: IBrowser;
	avif: boolean;
	preferredFormat: SevenTV.ImageFormat;
}

const agent = new UAParser();
const browser = agent.getBrowser();
const data = reactive<UserAgentHelper>({
	agent,
	browser,
	avif: browser.name === "Chrome" && parseInt(browser.version as string, 10) >= 100,
	preferredFormat: "WEBP",
});

export function useUserAgent() {
	return data;
}
