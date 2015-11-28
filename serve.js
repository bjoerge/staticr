var getFactoryStream = require("./lib/getFactoryStream");
var createRoutes = require("./lib/createRoutes");
var mime = require("mime");
var path = require("path");

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

      var mimetype = path.extname(found.path) ? mime.lookup(found.path) : 'text/html';

      res.type(mimetype);

      if (err) {
        return next(err);
      }
      stream
          .on('error', next)
          .pipe(res);
    });
  }
};