import webpack from 'webpack'
import webpackDevConfig from '../config/webpack'
import MemoryFileSystem from 'memory-fs'

export const compiler = webpack(webpackDevConfig)
compiler.outputFileSystem = new MemoryFileSystem()

const mapping = {}

compiler.plugin('after-emit', function (compilation, cb) {
  const assets = Object.keys(compilation.assets)
  assets.forEach(function (assetName) {
    mapping[assetName] = function () {
      return compilation.assets[assetName].source()
    }
  })
  if (firstBuild) {
    firstBuild = false
    callbacks.forEach(callback => {
      callback(null, mapping)
    })
  }
  cb()
})

let firstBuild = true
const callbacks = []

function ensureBuildFirst (callback) {
  if (!firstBuild) {
    callback(null, mapping)
  }
  callbacks.push(callback)
}

if (process.staticr === 'build') {
  compiler.run(function (err, stats) {
    if (err) {
      throw err
    }
  })
} else {
  compiler.watch({}, function (err, stats) {
    if (err) {
      throw err
    }
  })
}

export default function resolve (callback) {
  ensureBuildFirst(callback)
}
