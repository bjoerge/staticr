var async = require("async");
var mkdirp = require("mkdirp");
var path = require("path");
var fs = require("fs");

module.exports = build;

function build(bundles, targetDir, cb) {
  var bundlesPaths = Object.keys(bundles);

  async.map(bundlesPaths, function (file, callback) {

    var factory = bundles[file];
    var target = path.join(targetDir, file);
    var tmpfile = target + '.tmp';

    async.series([
      mkdirp.bind(null, path.dirname(target)),
      bundleFactory.bind(null, factory, tmpfile)
    ], function (err) {
      if (err) {
        return callback(err);
      }
      fs.rename(tmpfile, target, function (err) {
        callback(err, target);
      });
    });
  }, cb);
}

function bundleFactory(factory, tmpfile, callback) {
  factory()
    .pipe(fs.createWriteStream(tmpfile))
    .on('close', callback)
    .on('error', callback);
}