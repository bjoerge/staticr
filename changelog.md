# Changelog

## 4.0.0
* [POSSIBLE BREAKING]: In staticr < 4.0 you could pass a stream to the callback given to the factory function like this:

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

* staticr now detects it if a route factory never resolves to a value. Previously this route would just cause the build 
to exit prematurely in silence with no errors:
* bugfix: last route were emitted twice
* Entire test suite is reworked and tap was replaced with mocha.

```
var routes = {
  "/foo.txt": function(callback) {
    // oops forgot to call callback()
  }
}
```

Now, instead an unhandled error will be thrown, causing the process to exit with a failure code (!= 0)

```
Error: Building static route `/foo.txt` ended prematurely. This is most likely due to a callback never being called in the route factory. Please inspect the function:

function (callback) {
  // forget to call callback()
}
```

This works for Promises that never resolves too!

## 3.1.1
* Update examples and make text/html default mime type for extension-less routes, (e.g. `/foo`) as these will be compiled to `<route>/index.html` (e.g. `/foo/index.html`) 

## 3.1.0
* Use interop-require for babel6 compat.
* Minor logging improvement

## 3.0.1
* Readme tweaks

## 3.0.0
* [BREAKING] Specify output directory using --out-dir instead of first command line argument
* Improve error handling and add more tests