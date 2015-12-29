var getFactoryStream = require('./lib/getFactoryStream')
var combineRoutes = require('./lib/combineRoutes')
var resolveRoutes = require('./lib/resolveRoutes')
var mime = require('mime')
var path = require('path')

module.exports = function serve (/* routes, [routes]... */) {
  var args = arguments
  return function serve (req, res, next) {
    resolveRoutes(combineRoutes.apply(null, args), function (err, routes) {
      if (err) {
        throw err
      }

      var found = null
      routes.some(function (route) {
        if (req.path === route.path) {
          found = route
          return true
        }
      })

      if (!found) {
        return next()
      }

      var mimetype = path.extname(found.path) ? mime.lookup(found.path) : 'text/html'
      res.type(mimetype)
      getFactoryStream(found)
        .on('error', next)
        .pipe(res)
    })
  }
}
