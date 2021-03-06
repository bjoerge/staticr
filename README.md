# staticr

[![Build Status](https://secure.travis-ci.org/bjoerge/staticr.png)](http://travis-ci.org/bjoerge/staticr)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

staticr allows you to define a set of routes that can be either served dynamically by express (e.g. during development) or built to static files on disk (e.g. in a deploy task).

See the [example](https://github.com/bjoerge/staticr/tree/master/example) directory for a complete, working example project.

## Quick example

All you need to do is define your static routes like this:

```js
// browserify.js

var browserify = require("browserify")
var routes = {
  '/js/main.js': function factory() {
    return browserify("./main.js").bundle();
  }
}
module.exports = routes;
```

Now you can serve this bundle using express:

```js
var serve = require("staticr/serve");
app.use(serve(require("./browserify.js"));
```

... or you can compile it to a `./public` folder from the command line like this.

```js
staticr --out-dir ./public ./browserify.js
```

The content of the stream returned from the static route function above is now written to `./public/js/main.js`

## What's so great about this?

- It allows you to operate with a flexible set of static routes that can be used in different contexts and environments. 
You have one central place to define how the static route should be generated depending on environment.

- You don't have to rely on another layer of indirection between your app and the tools that actually compiles the static resources.
  No more wrappers like `grunt-*`, `gulp-*` or `*-middleware` - you just use the `browserify`, `node-sass`, `less`
  packages and their apis directly.

  This again means:
  - You can upgrade to the shiny new browserify version the minute it is released and not have to wait for
    the maintainers of `gulp-browserify`, `grunt-browserify` or `browserify-middleware` to upgrade their versions of browserify.
  - You will never again be disappointed realizing that a super-useful feature of browserify is not exposed by the wrapper library.
  - You get rid of a whole lot of external dependencies that may contain bugs and break your app.

# Usage

### Defining routes 

The routes are defined as key, value pairs where the keys is the route and value is a factory function that returns
a *string*, a *readable stream* or accepts a *callback*, e.g:.

```js
var routes = {
  '/some/route.html': function factory() {
    return "<p>This is some content of some route</p>";
  }
}
```

If the function takes a callback, this callback must be called with either a string or a readable stream whenever the output is available.

For example, if you had to do something async in order to get the content for the above route, you could instead do:

```js
var routes = {
  '/some/route.html': function factory(callback) {
    doSomethingAsync(function(err, result) {
      if (err) {
        return callback(err);
      }
      callback(null, "<p>Got some async result " + result + "</p>");
    });

  }
}
```

Note: Any value returned from a route function that expects arguments are ignored silently.

### Command line API

```
Usage: staticr [options] <route file(s) ...>

  Options:

      --out-dir, -o <dir> Build all routes defined in route file(s) and output it to the specified
                          directory.

      --route, -r <route> Route(s) to include in build. If left out, all the
                          defined routes will be included.

             --stdout, -s Pipe a route to stdout instead of writing to output dir folder.
                          This option only works for single routes specified with the --route parameter.

     --require, -m <name> Require the given module. Useful for installing require hooks, e.g babel/register

    --exclude, -e <route> Route(s) to exclude from the build. By default, all the
                          defined routes will be included.
```

### Example: Development vs. production

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

var jade = require('jade');

// This bundle will be minified in production.
var routes = module.exports = {
  "/": function() {
    return jade.renderFile("./views/index.jade", {title: "Main"});
  },
  "/about": function() {
    return jade.renderFile("./views/about.jade", {title: "About"});
  }
};

```

### Example: Serve bundles dynamically with express

Routes will be regenerated and written to every response for every request. This is usually the behaviour you want during development.

```js
var express = require("express");

var app = express();

if (process.env.NODE_ENV === 'development') {
  var serve = require("staticr/serve");
  app.use(serve(require("./static-routes/sass-bundles")));
  app.use(serve(require("./static-routes/html-routes")));
  app.use(serve(require("./static-routes/browserify-bundles")));
}

```

### Example: Compile routes to target dir

Routes will be generated once and written to target directory. This can be done right before server startup.

```sh
NODE_ENV=production staticr --out-dir ./public \
 ./static-routes/sass-bundles.js \
 ./static-routes/html-routes \
 ./static-routes/browserify-bundles.js
```

### Another cool example!

Track down bloat of a browserified route using [disc](https://github.com/hughsk/discify)

```sh
staticr --stdout --route /main.js browserify-bundles.js | discify --open
```
