# staticr

staticr allows you to define a set of routes that can be either served dynamically by express (e.g. in development) or 
built to static files (e.g. in production)

This module is intended for a developer workflow where:

- A set of predefined routes (javascript bundles, html files) are generated and served dynamically during development
- These routes are built and written to static files on disk at deploy time (i.e. to be served by nginx)

See the [example](https://github.com/bjoerge/staticr/tree/master/example) directory for a complete, working example project.

## Usage

### Define the routes 

The routes are defined as an an object where keys route and the value are a factory that returns
a readable stream for the response.

### Example: browserify bundles

```js
// browserify-bundles.js

var browserify = require("browserify");
var uglify = require('uglify-stream');

// This bundle will be uglified in production.
var routes = module.exports = {
  "js/bundle.js": function() {

    var bundle = browserify("./js/entry.js", {
        debug: process.env.NODE_ENV === 'development'
      })
      .transform('envify')
      .bundle();

    if (process.env.NODE_ENV === 'production') {
      return bundle.pipe(uglify());
    }
    return bundle;
  }
};

// Dev only route
if (process.env.NODE_ENV == 'development') {
  routes['js/dev.js'] = function() {
    return browserify("./js/dev.js", {debug: true}).bundle();
  }
}
```

### Example: routes returning html

```js
// html-routes.js

var str = require('string-to-stream');
var jade = require('jade');

// This bundle will be minified in production.
var routes = module.exports = {
  "/": function() {
    return str(jade.renderFile("./views/index.jade", {env: process.env.NODE_ENV}));
  },
  "/about": function() {
    return str(jade.renderFile("./views/about.jade", {env: process.env.NODE_ENV}));
  }
};


```

### Serve bundles dynamically with express

Routes will be regenerated and written to every response for every request. This is the behaviour you want while developing.

```js
var path = require("path");
var express = require("express");

var app = express();

if (process.env.NODE_ENV === 'development') {
  var serve = require("../serve");
  app.use(serve.css(require("./sass-bundles")));
  app.use(serve.html(require("./html-routes")));
  app.use(serve.js(require("./browserify-bundles")));
}

```

## Compile routes to target dir

### Command line
```
staticr <target dir> <route files ...>
```

Routes will be generated once and written to target directory. This is what you want to do when deploying your app.

### Example
```sh
NODE_ENV=production ./node_modules/.bin/staticr public sass-bundles.js browserify-bundles.js html-routes.js
```
