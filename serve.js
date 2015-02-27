var path = require("path");
var getFactoryStream = require("./lib/getFactoryStream");
var createRoutes = require("./lib/createRoutes");

var getMimeType = require('simple-mime')('text/plain');

module.exports = function serve(routes) {

  routes = createRoutes(routes);

  return function serve(req, res, next) {
    var found = null;
    routes.some(function (route) {
      if (req.path == route.path) {
        return found = route;
      }
    });

    if (!found) {
      return next();
    }

    getFactoryStream(found, function (err, stream) {

      res.type(getMimeType(found.path));

      if (err) {
        return next(err);
      }
      stream
          .on('error', next)
          .pipe(res);
    });
  }
};