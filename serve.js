var path = require("path");
var getFactoryStream = require("./lib/getFactoryStream");
var createRoutes = require("./lib/createRoutes");

module.exports             = staticServer;
module.exports.js          = staticServer("application/javascript");
module.exports.html        = staticServer("text/html");
module.exports.css         = staticServer("text/css");
module.exports.text        = staticServer("text/plain");
module.exports.json        = staticServer("application/json");

function staticServer(type) {
  return function serve(routes) {

    routes = createRoutes(routes);

    return function serve(req, res, next) {
      var found = null;
      routes.some(function(route) {
        if (req.path == route.path) {
          return found = route;
        }
      });

      if (!found) {
        return next();
      }

      getFactoryStream(found, function(err, stream) {

        res.type(type);

        if (err) {
          return next(err);
        }
        stream
          .on('error', next)
          .pipe(res);
      });
    }
  };
}