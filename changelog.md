# Changelog

## 4.0.0

### Async route resolution

Instead of a {route => factoryFunction} map, a _route resolver_ can now be passed to staticr.

E.g.:

module.exports = function resolveRoutes(callback) {
  setTimeout(function() {
    callback(null, {
      '/foo.js': function() {
        return bundle('../foo.js')
      }
    })
  }, 1000)
}

This opens the possibility for using bundlers where the actual routes are not known up-front, or where multiple
static routes are built in a single operation, e.g. with webpack

### Webpack + React with HMR example added. See https://github.com/bjoerge/staticr/tree/master/examples

### [POSSIBLE BREAKING]: Removed support for passing streams to callback

In staticr < 4.0 you could pass a stream to the callback given to the factory function like this:

```
var routes = {
  "/foo.js": function(callback) {
    var stream = browserify('./foo.js').bundle()
    callback(null, stream)
  }
}
```

... or return a promise that resolves to a stream
```
var routes = {
  "/foo.js": function(callback) {
    var stream = browserify('./foo.js').bundle()
    return Promise.resolve(stream)
  }
}
```

This will no longer work in 4.0.0 and if you relied on this bug, you should update your route factory functions

### Detect if a route factory never resolves:

Staticr now detects if a route factory never resolves to a value. Previously this route would just cause the build 
to just exit prematurely in silence, with no errors

```
var routes = {
  "/foo.txt": function(callback) {
    // oops forgot to call callback()
  }
}
```

Now, instead an unhandled error will be thrown, causing the process to exit with a failure code (!= 0)

```
Error: Building static routes ended prematurely. This is most likely due to a promise that never gets resolved 
in the route factory. Please examine the factory function for route "/foo.txt":

function (callback) {
  // forget to call callback()
}
```

This works for Promises that never resolves too!
 
### Bugfix: last route were emitted twice
### Entire test suite is reworked and tap was replaced with mocha.

## 3.1.1
### `text/html` is now default mime type for extension-less routes

This also means that the extension-less route `/foo` will be compiled to `foo/index.html` 

## 3.1.0
### Use interop-require for babel 6 compat.
### Minor logging improvement

## 3.0.1
### Minor readme tweaks

## 3.0.0
### [BREAKING] Specify output directory using --out-dir instead of first command line argument
### Improve error handling and add more tests