declare const __ENVIRONMENT__: 'production' | 'development';

const byEnv = () => ({
	production: {
		apiUrl: '//api.7tv.app',
		wsUrl: '//ws.7tv.app',
		eventsUrl: '//events.7tv.app/v1',
		cdnUrl: '//cdn.7tv.app',
		secure: true,
	},
	development: {
		apiUrl: '//localhost:3000',
		wsUrl: '//localhost:3000/v2/ws',
		eventsUrl: '//localhost:3100/public/v1',
		cdnUrl: '//cdn.7tv.app',
		secure: false
	}
}[__ENVIRONMENT__]);

export const Config = {
	...byEnv()
};
