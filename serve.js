var getFactoryStream = require("./lib/getFactoryStream");
var createRoutes = require("./lib/createRoutes");
var mime = require("mime");

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

      res.type(mime.lookup(found.path));

      if (err) {
        return next(err);
      }
      stream
          .on('error', next)
          .pipe(res);
    });
  }
};