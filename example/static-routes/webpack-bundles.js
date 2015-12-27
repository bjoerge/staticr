var webpack = require('webpack')
var MemoryFileSystem = require('memory-fs')

var compiler = webpack({
  context: __dirname + '/app',
  entry: '../../bundles/webpack/entry.js',
  output: {
    path: '/dist',
    filename: '/js/webpack-bundle.js'
  }
})

compiler.outputFileSystem = new MemoryFileSystem()

module.exports = function resolve (callback) {
  compiler.plugin('after-emit', function (compilation, cb) {
    var mapping = {}
    Object.keys(compilation.assets).forEach(function (assetName) {
      mapping[assetName] = function () {
        return compilation.assets[assetName].source()
      }
    })
    callback(null, mapping)
    cb()
  })

  compiler.run(function (err, stats) {
    if (err) {
      return callback(err)
    }
  })
}
