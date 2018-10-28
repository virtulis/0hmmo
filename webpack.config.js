const webpack = require('webpack');

module.exports = (env, argv) => ({
	entry: './out/client-modules/web/game.js',
	output: {
		filename: 'game.js',
		publicPath: '/client/',
		path: process.cwd() + '/out/client'
	},
	module: {
		rules: [
			{
				test: /\.m?js$/,
				use: ['source-map-loader'],
				enforce: 'pre'
			}
		]
	},
	plugins: [new webpack.IgnorePlugin(/^moment$/)],
	devtool: argv.mode === 'production' ? 'source-map' : 'eval-source-map',
	mode: argv.mode || 'development'
});
