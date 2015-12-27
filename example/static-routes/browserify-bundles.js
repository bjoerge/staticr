var browserify = require('browserify')
var uglify = require('uglify-stream')

// This bundle will be uglified in production.
var routes = module.exports = {
  'js/browserify-bundle.js': function () {
    var bundle = browserify('./bundles/browserify/entry.js', {
      debug: process.env.NODE_ENV === 'development'
    })
      .transform('envify')
      .bundle()

    if (process.env.NODE_ENV === 'production') {
      return bundle.pipe(uglify())
    }
    return bundle
  }
}

// Dev only route
if (process.env.NODE_ENV === 'development') {
  routes['js/dev.js'] = function () {
    return browserify('./bundles/browserify/dev.js', {debug: true}).bundle()
  }
}
