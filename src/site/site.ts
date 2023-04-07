(async () => {
	const hostedURL = `http://127.0.0.1:8080/index.3.0.3.js`;
	if (hostedURL) {
		const scr = document.createElement("script");
		scr.id = "seventv-site-hosted";
		scr.src = hostedURL;
		scr.type = "module";

		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.type = "text/css";
		style.href = `http://127.0.0.1:8080/seventv.style.3.0.3.css`;
		style.setAttribute("charset", "utf-8");
		style.setAttribute("content", "text/html");
		style.setAttribute("http-equiv", "content-type");
		style.id = "seventv-stylesheet";

		document.head.appendChild(style);
		document.head.appendChild(scr);
	} else {
		import("./site.app");
	}
})();
