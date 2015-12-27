var flatten = require('flatten')

module.exports = function combineRoutes (/* ...routes */) {
  return flatten(Array.prototype.slice.call(arguments))
}
