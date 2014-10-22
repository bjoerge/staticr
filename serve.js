var path = require("path");

module.exports             = staticServer;
module.exports.javascript  = staticServer("application/javascript");
module.exports.js          = module.exports.javascript;
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
      res.type(type);

      var found = null;
      routes.some(function(route) {
        if (req.path == route.route) {
          return found = route;
        }
      });

      if (!found) {
        return next();
      }

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