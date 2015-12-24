/* global it, describe */
require('native-promise-only')
var proxyquire = require('proxyquire')
var str = require('string-to-stream')
var path = require('path')
var concat = require('concat-stream')
var assert = require('assert')

// A quick and dirty stub of fs.createWriteStream that can be passed in a custom function to do assertions
// The testFn will be called with filename and the buffer that got written to it
function stubFsWriteStream (testFn) {
  return function (filename) {
    var ws = concat(function (buf) {
      testFn(filename, buf)
      ws.emit('close')
    })
    return ws
  }
}

// A quick and dirty stub of fs.rename that can be passed in a custom function to do assertions
// The testFn will be called with oldPath, newPath and the callback passed in.
function stubFsRename (testFn) {
  return function (oldPath, newPath, cb) {
    testFn(oldPath, newPath, cb)
    process.nextTick(cb)
  }
}

// A quick and dirty stub of fs.rename that can be passed in a custom function to do assertions
// The testFn will be called with oldPath, newPath and the callback passed in.
function stubMkdirp (testFn) {
  return function (dir, cb) {
    testFn(dir, cb)
    process.nextTick(cb)
  }
}

// Takes a list of functions and returns a new function that will call each in the sequence the returned
// function is called
function seq (_fns) {
  var fns = _fns.slice()
  var callCount = 0
  return function () {
    var next = fns.shift()
    callCount++
    if (!next) {
      throw new Error('Received too many calls. Expected ' + _fns.length + ' got ' + callCount)
    }
    return next.apply(this, arguments)
  }
}

var specs = [
  {
    path: '/stream.js',
    factory: function () {
      return str('some stream')
    },
    expect: {
      tempFile: 'build/stream.js.staticr-tmp',
      target: 'build/stream.js',
      content: 'some stream'
    }
  },
  {
    path: '/string.js',
    factory: function () {
      return 'string'
    },
    expect: {
      tempFile: 'build/string.js.staticr-tmp',
      target: 'build/string.js',
      content: 'string'
    }
  },
  {
    path: '/callback.js',
    factory: function (callback) {
      setTimeout(function () {
        callback(null, 'callback content')
      }, 10)
    },
    expect: {
      tempFile: 'build/callback.js.staticr-tmp',
      target: 'build/callback.js',
      content: 'callback content'
    }
  },
  {
    path: '/promise.js',
    factory: function () {
      return Promise.resolve('this is content')
    },
    expect: {
      tempFile: 'build/promise.js.staticr-tmp',
      target: 'build/promise.js',
      content: 'this is content'
    }
  }
]

var outDir = './build'

describe('different return types from promise factory', function () {
  it('works', function (done) {
    var build = proxyquire('../build', {
      mkdirp: seq(
        specs.map(function (spec) {
          return stubMkdirp(function (dir) {
            assert.equal(dir + '/', path.join(outDir, path.dirname(spec.path)))
          })
        })
      ),
      fs: {
        createWriteStream: seq(
          specs.map(function (spec) {
            return stubFsWriteStream(function (filename, buffer) {
              assert.equal(filename, spec.expect.tempFile)
              assert.equal(buffer.toString(), spec.expect.content)
            })
          })
        ),
        rename: seq(
          specs.map(function (spec) {
            return stubFsRename(function (oldPath, newPath) {
              assert.equal(oldPath, spec.expect.tempFile)
              assert.equal(newPath, spec.expect.target)
            })
          }))
      }
    })

    build(specs, outDir).on('end', done)
  })
})
