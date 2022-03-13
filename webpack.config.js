const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'worker.js',
    path: path.resolve(__dirname, './dist'),
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.html?$/i,
        type: 'asset/source',
      },
      {
        test: /\.(gif|png)$/i,
        type: 'asset/inline',
      },
    ],
  },
  optimization: {
    minimize: false,
  },
  plugins: [new CleanWebpackPlugin()],
};
