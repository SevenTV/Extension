const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports = env => {
	return {
		mode: 'development',
		devtool: 'cheap-module-source-map',
		entry: {
			content: path.join(__dirname, 'src/Content/Content.tsx'),
			background: path.join(__dirname, 'src/Background/Background.tsx'),
			twitch: path.join(__dirname, 'src/Sites/twitch.tv/twitch.tsx'),
			youtube: path.join(__dirname, 'src/Sites/youtube.com/youtube.tsx'),
	
			ffz_addon: path.join(__dirname, 'src/Sites/twitch.tv/FFZ/FrankerFaceZ.Addon.ts'),
			ffz_hook: path.join(__dirname, 'src/Sites/twitch.tv/FFZ/FrankerFaceZ.Hook.ts'),
		},
		output: { path: path.join(__dirname, env.DIST || 'dist'), filename: '[name].js' },
		module: {
			rules: [
				{
					test: /\.(js|jsx)$/,
					use: 'babel-loader',
					exclude: /node_modules/,
				},
				{
					test: /\.ts(x)?$/,
					loader: 'ts-loader',
					exclude: /node_modules/,
				},
				{
					test: /\.s[ac]ss$/i,
					use: [
						{
							loader: 'file-loader',
							options: { outputPath: 'styles/', name: '[name].css' }
						},
						'sass-loader'
					]
				},
				{
					test: /\.svg$/,
					use: ['@svgr/webpack'],
				},
				{
					test: /\.png$/,
					use: [
						{
							loader: 'url-loader',
							options: {
								mimetype: 'image/png',
							},
						},
					],
				},
			]
		},
		resolve: {
			plugins: [new TsconfigPathsPlugin()],
			extensions: ['.js', '.jsx', '.tsx', '.ts'],
			alias: {
				'react-dom': '@hot-loader/react-dom',
			},
		},
		devServer: {
			contentBase: './dist',
		},
		plugins: [
			new CopyPlugin({
				patterns: [
					{ from: 'public/icon', to: '.', },
					{ from: 'public/image', to: 'image/' },
					{ from: 'public/yt_upgrade', to: 'yt_upgrade/' },
					{
						from: `public/manifest.v${env.MANIFEST_VERSION === '3' ? '3' : '2'}.json`,
						to: 'manifest.json'
					}
				],
			}),
			new DefinePlugin({
				__ENVIRONMENT__: JSON.stringify('development'),
				AppMeta: JSON.stringify({ version: 1 })
			}),
		],
	}
};
