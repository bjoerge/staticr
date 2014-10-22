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
