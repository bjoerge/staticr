## Big fat disclaimer: Work in progress

# build-static

build-static allows you to define routes that can be written either served on demand, or built as static files (e.g. upon deploy)

This module is intended for a developer workflow where:

- A predefined set of routes (e.g. browserify bundles) are served dynamically through express during development
- This set of routes are built and written to disk upon deploy (i.e. so that they can be statically served by nginx)

## Usage

### Define the routes 

The routes are defined as an an object where keys route and the value are a factory that creates the response and returns
a readable stream

### Example: browserify bundles

```js
// routes.js

var browserify = require("browserify");

// This bundle will be minified in production. In development we transform source maps relative to cwd using
// the mold-source-map module.

exports['somefile.js'] = function() {
    var bundle = browserify({
      debug: env === 'development',
      fullPaths: env == 'development'
    })
      .transform('envify')
      .require(require.resolve('./browser/somefile.js'), {entry: true})
      .bundle();

    if (env === 'development') {
      return bundle
        .pipe(require('mold-source-map')
        .transformSourcesRelativeTo(process.cwd()))
    }

    return bundle.pipe(uglifyStream())
  }
}

// Dev only route
if (process.env.NODE_ENV == 'development') {
  exports['onlydev.js'] = function() {
      return browserify({debug: true})
        .require(require.resolve('./browser/onlydev.js'), {entry: true})
        .bundle();
      }
  }
}

```
### Serve bundles from express in development

```js
var express = require("express");

if (process.env.NODE_ENV === 'development') {
  var browserify = require("build-static/serve-browserify");
  app.get("/js", browserify(require("./bundles.js")));
}

// Optionally serve static files through express 
app.use(express.static(path.join(__dirname, 'public')));

```

## Compile routes to target dir

```sh
$ ./node_modules/.bin/build-static ./browserify-bundles.js ./public/js
```