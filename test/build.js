var proxyquire = require("proxyquire");
var test = require("tap").test;
var str = require("string-to-stream");
var through = require("through2");
var concat = require("concat-stream");

// A quick and dirty stub of fs.createWriteStream that can be passed in a custom function to do assertions
// The testFn will be called with filename and the buffer that got written to it
function stubFsWriteStream(testFn) {
  return function(filename) {
    var ws = concat(function (buf) {
      testFn(filename, buf);
      ws.emit('close');
    });
    return ws;
  }
}

// A quick and dirty stub of fs.rename that can be passed in a custom function to do assertions
// The testFn will be called with oldPath, newPath and the callback passed in.
function stubFsRename(testFn) {
  return function(oldPath, newPath, cb) {
    testFn(oldPath, newPath, cb);
    process.nextTick(cb);
  }
}

// A quick and dirty stub of fs.rename that can be passed in a custom function to do assertions
// The testFn will be called with oldPath, newPath and the callback passed in.
function stubMkdirp(testFn) {
  return function(dir, cb) {
    testFn(dir, cb);
    process.nextTick(cb);
  }
}

// Takes a list of functions and returns a new function that will call each in the sequence the returned 
// function is called
function seq() {
  var fns = Array.prototype.slice.call(arguments);
  return function() {
    var next = fns.shift();
    return next.apply(this, arguments);
  }
}

test("build pipeline", function (t) {

  var build = proxyquire("../build", {
    mkdirp: seq(
      stubMkdirp(function(dir) {
          t.equal(dir, 'build');
      }),
      stubMkdirp(function(dir) {
          t.equal(dir, 'build');
      }),
      stubMkdirp(function(dir) {
          t.equal(dir, 'build/a-directory');
      })
    ),
    fs: {
      createWriteStream: seq(
        stubFsWriteStream(function(filename, buffer) {
          t.equal(filename, 'build/foo.js.staticr-tmp');
          t.equal(buffer.toString(), 'foo');
        }),
        stubFsWriteStream(function(filename, buffer) {
          t.equal(filename, 'build/bar.js.staticr-tmp');
          t.equal(buffer.toString(), 'bar');
        }),
        stubFsWriteStream(function(filename, buffer) {
          t.equal(filename, 'build/a-directory/index.html.staticr-tmp');
          t.equal(buffer.toString(), 'this is the index');
        })
      ),
      rename: seq(
        stubFsRename(function(oldPath, newPath) {
          t.equal(oldPath, 'build/foo.js.staticr-tmp');
          t.equal(newPath, 'build/foo.js');
        }),
        stubFsRename(function(oldPath, newPath) {
          t.equal(oldPath, 'build/bar.js.staticr-tmp');
          t.equal(newPath, 'build/bar.js');
        }),
        stubFsRename(function(oldPath, newPath) {
          t.equal(oldPath, 'build/a-directory/index.html.staticr-tmp');
          t.equal(newPath, 'build/a-directory/index.html');
        })
      )
    }
  });

  var routes = {
    '/foo.js': function () {
      return str("foo")
    },
    '/bar.js': function () {
      return str("bar")
    },
    '/a-directory': function () {
      return str("this is the index")
    }
  };

  build(routes, './build').on('end', function() { 
      t.end();
    });
});