import { spawn } from "node:child_process";
import { createServer } from "node:net";

export function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAvailablePort() {
	return await new Promise((resolve, reject) => {
		const server = createServer();
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			if (!address || typeof address === "string") {
				server.close();
				reject(new Error("Could not allocate a local WebDriver port"));
				return;
			}
			server.close((error) => (error ? reject(error) : resolve(address.port)));
		});
	});
}

export class WebDriverClient {
	constructor(endpoint) {
		this.endpoint = endpoint.replace(/\/$/, "");
		this.sessionId = null;
	}

	async request(method, path, body) {
		const response = await fetch(`${this.endpoint}${path}`, {
			method,
			headers: body === undefined ? undefined : { "content-type": "application/json" },
			body: body === undefined ? undefined : JSON.stringify(body),
		});
		const payload = await response.json().catch(() => ({}));
		if (!response.ok || payload?.value?.error) {
			const detail = payload?.value?.message ?? `${response.status} ${response.statusText}`;
			throw new Error(`WebDriver ${method} ${path} failed: ${detail}`);
		}
		return payload.value;
	}

	async createSession() {
		const value = await this.request("POST", "/session", {
			capabilities: { alwaysMatch: { browserName: "safari" } },
		});
		this.sessionId = value.sessionId;
		return value;
	}

	async command(method, path, body) {
		if (!this.sessionId) throw new Error("WebDriver session has not been created");
		return await this.request(method, `/session/${this.sessionId}${path}`, body);
	}

	async navigate(url) {
		return await this.command("POST", "/url", { url });
	}

	async refresh() {
		return await this.command("POST", "/refresh", {});
	}

	async execute(script, args = []) {
		return await this.command("POST", "/execute/sync", { script, args });
	}

	async screenshot() {
		return await this.command("GET", "/screenshot");
	}

	async close() {
		if (!this.sessionId) return;
		try {
			await this.request("DELETE", `/session/${this.sessionId}`);
		} finally {
			this.sessionId = null;
		}
	}
}

export async function waitForCondition(probe, accept, { timeoutMs, intervalMs = 250, label }) {
	const deadline = Date.now() + timeoutMs;
	let latest;
	let latestError;
	while (Date.now() < deadline) {
		try {
			latest = await probe();
			latestError = undefined;
			if (accept(latest)) return latest;
		} catch (error) {
			latestError = error;
		}
		await delay(intervalMs);
	}
	const suffix = latestError
		? latestError.message
		: `last observation: ${JSON.stringify(latest)}`;
	throw new Error(`Timed out waiting for ${label}: ${suffix}`);
}

export async function startSafariDriver({ executable = "/usr/bin/safaridriver", timeoutMs = 10_000 } = {}) {
	const port = await getAvailablePort();
	const child = spawn(executable, ["--port", String(port)], {
		stdio: ["ignore", "pipe", "pipe"],
	});
	let diagnostics = "";
	child.stdout.on("data", (chunk) => (diagnostics += chunk.toString()));
	child.stderr.on("data", (chunk) => (diagnostics += chunk.toString()));

	const client = new WebDriverClient(`http://127.0.0.1:${port}`);
	try {
		await waitForCondition(
			async () => await client.request("GET", "/status"),
			(value) => value?.ready === true,
			{ timeoutMs, label: "safaridriver readiness" },
		);
	} catch (error) {
		child.kill("SIGTERM");
		throw new Error(`${error.message}${diagnostics ? `\n${diagnostics.trim()}` : ""}`);
	}

	return {
		client,
		port,
		diagnostics: () => diagnostics,
		stop: async () => {
			if (child.exitCode !== null) return;
			child.kill("SIGTERM");
			await Promise.race([
				new Promise((resolve) => child.once("exit", resolve)),
				delay(2_000).then(() => child.kill("SIGKILL")),
			]);
		},
	};
}
