declare const __ENVIRONMENT__: 'production' | 'development';

const byEnv = () => ({
	production: {
		apiUrl: '//api.7tv.app',
		wsUrl: '//ws.7tv.app',
		cdnUrl: '//cdn.7tv.app',
		secure: true,
	},
	development: {
		apiUrl: '//localhost:3000',
		wsUrl: '//localhost:3000/v2/ws',
		cdnUrl: '//cdn.7tv.app',
		secure: false
	}
}[__ENVIRONMENT__]);

export const Config = {
	...byEnv()
};
