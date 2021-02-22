import { HttpListener } from 'src/API/HttpListener';

export class Client {
	static instance: Client;

	http = new HttpListener();

	constructor() {
		if (!!Client.instance) { // Prevent duplicate Client instances from being created
			throw new Error('Client is already instantiated.');
		}

		this.http.listen();
	}
}

export namespace Client {
	/**
	 * (Decorator) Injects the Client instance into a class
	 */
	export function Get(constructor: Function) {
		constructor.prototype.client = Client.instance;
	}
}

Client.instance = new Client();
