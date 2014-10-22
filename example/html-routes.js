var str = require('string-to-stream');
var jade = require('jade');

// This bundle will be minified in production.
var routes = module.exports = {
  "/": function() {
    return str(jade.renderFile("./views/index.jade", {env: process.env.NODE_ENV}));
  },
  "/about": function() {
    return str(jade.renderFile("./views/about.jade", {env: process.env.NODE_ENV}));
  }
};
