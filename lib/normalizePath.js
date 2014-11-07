var path = require("path");

module.exports = function normalize(p) {
  return path.join("/", p); 
};