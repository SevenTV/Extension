import { createServer, httpListener, HttpMiddlewareEffect } from '@marblejs/core';
import { logger$ } from '@marblejs/middleware-logger';
import { bodyParser$ } from '@marblejs/middleware-body';
import { RootRoute } from 'src/API/Routes/RootRoute';
import { EmotesRoute } from 'src/API/Routes/EmotesRoute';
import { cors$ } from '@marblejs/middleware-cors';

export class HttpListener {
	setMiddlewares(): HttpMiddlewareEffect[] {
		return [
			logger$({}),
			bodyParser$({}),
			cors$({
				origin: '*',
				allowHeaders: '*',
				methods: ['GET']
			})
		];
	}

	listen(): void {
		const listener = httpListener({
			middlewares: this.setMiddlewares(),
			effects: [
				RootRoute,
				EmotesRoute
			]
		});

		const server = createServer({
			port: 3000,
			hostname: 'localhost',
			listener
		});

		const main = async () => await (await server)();
		main();
	}
}
