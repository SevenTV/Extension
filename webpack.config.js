const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const { DefinePlugin } = require('webpack');

const config = {
	mode: 'development',
	devtool: 'cheap-module-source-map',
	entry: {
		content: path.join(__dirname, 'src/Content/Content.tsx'),
		background: path.join(__dirname, 'src/Background/Background.tsx'),
		page: path.join(__dirname, 'src/Page/Page.tsx'),

		ffz_addon: path.join(__dirname, 'src/Page/FFZ/FrankerFaceZ.Addon.ts'),
		ffz_loader: path.join(__dirname, 'src/Page/FFZ/FrankerFaceZ.Loader.ts'),
	},
	output: { path: path.join(__dirname, 'dist'), filename: '[name].js' },
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
			patterns: [{ from: 'public', to: '.' }],
		}),
		new DefinePlugin({
			__ENVIRONMENT__: JSON.stringify('development'),
			AppMeta: JSON.stringify({ version: 1 })
		}),
	],
};

module.exports = config;
