var env = process.env.NODE_ENV || 'development';

var browserify = require("browserify");

var through = require("through");
var UglifyJS = require("uglify-js");

function uglifyStream() {
  var buf = '';
  return through(write, end);

  function write(chunk) {
    buf += chunk;
  }
  function end() {
    this.queue(UglifyJS.minify(buf, {fromString: true}).code)
    this.queue(null)
  }
}

exports["/foo.js"] = function () {

  var bundle = browserify({
    debug: env === 'development',
    fullPaths: env == 'development'
  })
    .transform('envify')
    .require(require.resolve('./browser/main.js'), {entry: true})
    .bundle();

  if (env === 'production') {
    return bundle.pipe(uglifyStream())
  }

  if (env === 'development') {
    return bundle.pipe(require('mold-source-map').transformSourcesRelativeTo(process.cwd()))
  }
};
