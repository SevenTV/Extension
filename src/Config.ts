declare const __ENVIRONMENT__: 'production' | 'development';

const byEnv = () => ({
	production: {
		apiUrl: 'https://api.7tv.app',
		cdnUrl: 'https://cdn.7tv.app'
	},
	development: {
		apiUrl: 'http://localhost:3000',
		cdnUrl: 'https://cdn.7tv.app'
	}
}[__ENVIRONMENT__]);

export const Config = {
	...byEnv()
};
