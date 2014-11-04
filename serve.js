var path = require("path");

module.exports             = staticServer;
module.exports.js          = staticServer("application/javascript");
module.exports.html        = staticServer("text/html");
module.exports.css         = staticServer("text/css");
module.exports.text        = staticServer("text/plain");
module.exports.json        = staticServer("application/json");

function staticServer(type) {
  return function serve(routes) {
    routes = Object.keys(routes).map(function(route) {
      return {
        route: path.join('/', route),
        factory: routes[route]
      }
    });
    return function serve(req, res, next) {
      var found = null;
      routes.some(function(route) {
        if (req.path == route.route) {
          return found = route;
        }
      });

      if (!found) {
        return next();
      }

      res.type(type);
      try {
        found.factory()
          .on('error', next)
          .pipe(res);
      }
      catch (e) {
        next(e);
      }
    }
  };
};