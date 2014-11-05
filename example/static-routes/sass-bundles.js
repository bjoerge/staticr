var sass = require('node-sass');


// This bundle will be minified in production.
var routes = module.exports = {
  "/css/main.css": function(callback) {
    sass.render({
      file: require.resolve("../stylesheets/main.scss"),
      success: callback.bind(null, null),
      error: function(errmsg) {
        callback(new Error(errmsg));
      }
    });
  }
};
