var getFactoryStream = require('./lib/getFactoryStream')
var combineRoutes = require('./lib/combineRoutes')
var resolveRoutes = require('./lib/resolveRoutes')
var mime = require('mime')
var path = require('path')

module.exports = function serve (/* routes, [routes]... */) {
  var routedefs = combineRoutes.apply(null, arguments)
  var routes
  var pending = false
  var callbacks = []

  function _resolveRoutes (callback) {
    if (routes) {
      process.nextTick(function () {
        callback(null, routes)
      })
      return
    }

    callbacks.push(callback)

    if (pending) {
      return
    }

    pending = true

    resolveRoutes(routedefs, function (err, resolvedRoutes) {
      routes = resolvedRoutes
      callbacks.forEach(function (callback) {
        callback(err, routes)
      })
      callbacks = []
    })
  }

  return function serve (req, res, next) {
    _resolveRoutes(function (err, routes) {
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
