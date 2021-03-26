import * as React from "react";
import * as ReactDOM from "react-dom";
import { Subject } from "rxjs";
import { MessageRenderer } from "src/Content/Runtime/MessageRenderer";
import { EmoteStore } from "src/Content/Util/EmoteStore";
import { Logger } from "src/Logger";
import styled from "styled-components";

class Main extends React.Component {
	render() {
		return (
			<Main.Style></Main.Style>
		);
	}
}

namespace Main {
	export const Style = styled.div``;
}

export const Content = {
	onMessage: new Subject<any>(),
	PageReady: new Subject<void>(),
	EmoteStore: new EmoteStore(),
};

const onInjected = () => {
	const app = document.createElement("div");
	app.id = "seventv";
	document.body.appendChild(app);
	ReactDOM.render(<Main />, app);
};

{
	const script = document.createElement("script");
	script.src = chrome.runtime.getURL("page.js");
	script.onload = () => {
		Logger.Get().info("Injected into Twitch");

		onInjected();
	};

	(document.head ?? document.documentElement).appendChild(script);
}

window.onbeforeunload = () =>
	chrome.runtime.sendMessage({
		tag: "Unload",
	});

Logger.Get().info("Extension is loading up!");

// Listen for messages from background
// Forward them to page
let pageReady = false;
const bufferedPageEvents = [] as CustomEvent[];
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
	const ev = new CustomEvent(`7TV#BackgroundExtMessage`, { detail: msg });
	pageReady ? window.dispatchEvent(ev) : bufferedPageEvents.push(ev);

	sendResponse(true);
});

// Listen to page becoming ready
window.addEventListener("7TV#PageScriptReady", () => {
	pageReady = true;
	for (const ev of bufferedPageEvents) {
		window.dispatchEvent(ev);
	}
});

window.addEventListener("7TV#RenderChatLine", (event) => {
	if (!(event instanceof CustomEvent)) return undefined;
	const ev = event as CustomEvent;
	const data = JSON.parse(ev.detail);

	console.log("Hihi", event);
	const renderer = new MessageRenderer(data.msg, data.elementId);

	renderer.renderMessageTree();
	renderer.insert();
});
