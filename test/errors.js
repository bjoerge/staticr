/* global it, describe */

require('native-promise-only')
var proxyquire = require('proxyquire')
var Readable = require('stream').Readable
var assert = require('assert')
var concat = require('concat-stream')

var outDir = './build'

var specs = [
  {
    it: 'handles sync errors',
    path: '/throw.js',
    factory: function () {
      throw new Error('Something bad')
    },
    expectedMessage: 'Something bad'
  },
  {
    it: 'handles stream errors',
    path: '/stream.js',
    factory: function () {
      var stream = new Readable()
      stream._read = function () {}

      stream.push('foo')
      setTimeout(function () {
        stream.emit('error', new Error('Stream failed'))
      }, 50)

      return stream
    },
    expectedMessage: 'Stream failed'
  },
  {
    it: 'handles callback errors',
    path: '/callback.js',
    factory: function (callback) {
      setTimeout(function () {
        callback(new Error('callback failure'))
      }, 50)
    },
    expectedMessage: 'callback failure'
  },
  {
    it: 'handles promise errors',
    path: '/promise.js',
    factory: function () {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          reject(new Error('Promised error'))
        }, 50)
      })
    },
    expectedMessage: 'Promised error'
  }
]

var build = proxyquire('../build', {
  mkdirp: function (path, callback) {
    process.nextTick(callback)
  },
  fs: {
    createWriteStream: function (filename) {
      return concat(function () {})
    }
  }
})

describe('Error handling', function () {
  specs.forEach(function (spec) {
    it(spec.it, function (done) {
      var routes = [
        {
          path: spec.path,
          factory: spec.factory
        }
      ]
      build(routes, outDir)
        .on('error', function (error) {
          assert.equal(error.message, spec.expectedMessage)
          done()
        })
    })
  })
})
