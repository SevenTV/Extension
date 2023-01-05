// Inject extension into site
const inject = () => {
	// Script
	const script = document.createElement("script");
	script.src = import.meta.env.DEV ? import.meta.env.BASE_URL + "src/site/site.ts" : chrome.runtime.getURL("site.js");
	script.id = "seventv";
	script.type = "module";
	script.setAttribute("worker_url", chrome.runtime.getURL("worker.js"));

	// Style
	const style = document.createElement("link");
	style.rel = "stylesheet";
	style.type = "text/css";
	style.href = chrome.runtime.getURL("assets/style.css");
	style.setAttribute("charset", "utf-8");
	style.setAttribute("content", "text/html");
	style.setAttribute("http-equiv", "content-type");
	style.id = "seventv-stylesheet";

	(document.head || document.documentElement).appendChild(script);
	(document.head || document.documentElement).appendChild(style);
};

(() => {
	inject();
})();
