var map = require('map-async')
var createRoutes = require('../lib/createRoutes')
var flatten = require('flatten')
var isPromise = require('is-promise')
var xtend = require('xtend')

function resolveRoute (route, callback) {
  if (typeof route !== 'function') {
    process.nextTick(function () {
      callback(null, route)
    })
    return
  }

  var possiblePromise = route.length === 1 ? route(callback) : route()

  if (isPromise(possiblePromise)) {
    possiblePromise.then(function (routes) {
      callback(null, routes)
    }, callback)
  }
}

module.exports = function (routes, callback) {
  map(routes, resolveRoute, function (err, resolvedRoutes) {
    if (err) {
      return callback(err)
    }
    var merged = xtend.apply(null, flatten(resolvedRoutes))
    callback(null, createRoutes(merged))
  })
}
