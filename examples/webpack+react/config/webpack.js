import ExtractTextPlugin from 'extract-text-webpack-plugin'
import path from 'path'
import webpack from 'webpack'

const development = process.env.NODE_ENV === 'development'

export default {
  entry: [
    development && 'webpack-hot-middleware/client',
    path.resolve(__dirname, '../browser/entry.js')
  ].filter(Boolean),
  output: {
    path: '/dist',
    filename: '/build/bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders: [
          development && 'react-hot',
          'babel'
        ].filter(Boolean)
      },
      {
        test: /\.scss$/,
        loaders: [
          'style',
          development ? 'css' : ExtractTextPlugin.extract('style-loader', 'css-loader'),
          'sass'
        ]
      }
    ].filter(Boolean)
  },
  plugins: [
    development && new webpack.optimize.OccurenceOrderPlugin(),
    development && new webpack.HotModuleReplacementPlugin(),
    development && new webpack.NoErrorsPlugin(),
    !development && new ExtractTextPlugin('/build/styles.css', {
      allChunks: true
    }),
    !development && new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new webpack.DefinePlugin({
      'process.browser': JSON.stringify(true),
      'process.env': {
        BROWSER: JSON.stringify(true)
        // NODE_ENV: process.env.NODE_ENV
      }
    })
  ].filter(Boolean)
}
