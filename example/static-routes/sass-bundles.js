var sass = require('node-sass');


// This bundle will be minified in production.
var routes = module.exports = {
  "/css/main.css": function(callback) {
    var options = {
      file: require.resolve('../stylesheets/main.scss'),
      omitSourceMapUrl: true,
      outputStyle: 'nested'
    }
    sass.render(options, function (err, result) {
      if (err) {
        return callback(err)
      }
      callback(null, result.css)
    })
  }
};
