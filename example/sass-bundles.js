var sass = require('node-sass');
var through = require('through2');

function streamify(cb) {
  var stream = through();

  cb(end, fail);
  
  return stream;

  function end(data) {
    stream.push(data);
    stream.push(null);
  }
  function fail(error) {
    stream.emit('error', error);
  }
}

// This bundle will be minified in production.
var routes = module.exports = {
  "/css/main.css": function() {
    return streamify(function(end, fail) {
      sass.render({
        file: require.resolve("./stylesheets/main.scss"),
        success: end,
        error: fail
      });
    });
  }
};
