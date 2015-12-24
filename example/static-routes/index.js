var xtend = require('xtend')

module.exports = xtend(
  require('./browserify-bundles'),
  require('./html-routes'),
  require('./sass-bundles')
)
