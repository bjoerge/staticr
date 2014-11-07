var normalizePath = require("../lib/normalizePath");

module.exports = fromObject;

function createRoute(path, factory) {
  return {
    key: path,
    path: normalizePath(path),
    factory: factory
  }
}

function fromObject(object) {
  return Object.keys(object).map(function(path) {
    return createRoute(path, object[path]);
  });
}