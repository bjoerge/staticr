var jade = require('jade')

// This bundle will be minified in production.
module.exports = {
  '/': function () {
    return jade.renderFile('./views/index.jade', {env: process.env.NODE_ENV})
  },
  '/about': function () {
    return jade.renderFile('./views/about.jade', {env: process.env.NODE_ENV})
  }
}
