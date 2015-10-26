require("native-promise-only")
var proxyquire = require("proxyquire");
var createRoutes = require("../lib/createRoutes");
var test = require("tap").test;
var str = require("string-to-stream");
var path = require("path");
var Readable = require("stream").Readable;
var through = require("through2");
var concat = require("concat-stream");

test('different return types from factory', function (t) {
  var outDir = './build'

  var specs = [
    {
      path: '/throw.js',
      factory: function () {
        throw new Error('Something bad')
      },
      expectedMessage: 'Something bad'
    },
    //Todo: figure out why this fails
    // {
    //  path: '/stream.js',
    //  factory: function () {
    //    var stream = new Readable()
    //    stream._read = function() {}
    //    stream.emit('readable')
    //
    //    setTimeout(function() {
    //      stream.emit('error', new Error('Stream failed'))
    //    }, 100)
    //
    //    return stream
    //  },
    //  expectedMessage: 'Stream failed'
    //},
    {
      path: '/callback.js',
      factory: function (callback) {
        setTimeout(function () {
          callback(new Error('callback failure'))
        }, 10)
      },
      expectedMessage: 'callback failure'
    },
    {
      path: '/promise.js',
      factory: function () {
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            reject(new Error('Promised error'))
          }, 100)
        })
      },
      expectedMessage: 'Promised error'
    }
  ]

  var build = proxyquire("../build", {
    mkdirp: function (path, callback) {
      process.nextTick(callback)
    },
    fs: {
      createWriteStream: function (filename) {
        var ws = concat(function (buf) {
        });
        return ws;
      }
    }
  })

  t.plan(specs.length)
  specs.forEach(function (spec) {
    var routes = [
      {
        path: spec.path,
        factory: spec.factory
      }
    ]

    build(routes, outDir)
      .on('error', function (error) {
        t.equal(error.message, spec.expectedMessage)
      })
      .on('end', function () {
        t.fail('Expected build to fail')
      })
  })
})