
var mkdirp = require("mkdirp");
var path = require("path");
var fs = require("fs");
var es = require("event-stream");
var through = require("through2");
var xtend = require("xtend");
var getFactoryStream = require("./lib/getFactoryStream");

var TEMPFILE_SUFFIX = '.staticr-tmp';

module.exports = build;

function build(routes, targetDir) {
  return es
    .readArray(prepareRoutes(routes, targetDir))
    .pipe(ensurePaths())
    .pipe(writeToTempfile())
    .pipe(waitForAll())
    .pipe(atomicRename())
}

function prepareRoutes(routes, targetDir) {
  return routes.map(function(route) {
    var target = path.join(targetDir, resolveTarget(route.path));
    var tmpfile = target + TEMPFILE_SUFFIX;
    return xtend(route, {
      target: target,
      tmpfile: tmpfile
    });
  });
}

function ensurePaths() {
  return through.obj(function(route, enc, cb) {
    mkdirp(path.dirname(route.target), function() {
      this.push(route);
      cb();
    }.bind(this));
  });
}

function writeToTempfile() {
  return through.obj(function(route, enc, cb) {
    var self = this;
    getFactoryStream(route, function(err, stream) {
      if (err) {
        return cb(err);
      }
      stream
        .pipe(fs.createWriteStream(route.tmpfile))
        .on('error', self.emit.bind(self, 'error'))
        .on('close', self.push.bind(self, route))
        .on('close', cb);
    });
  })
}

function atomicRename() {
  return through.obj(function(routes, enc, cb) {
    var self = this;
    var pending = routes.length;
    routes.forEach(function(route) {
      fs.rename(route.tmpfile, route.target, function (err) {
        pending--;
        if (err) {
          return self.emit('error', err)
        }
        self.push(route);
        if (pending === 0) {
          cb();
        }
      });
    });
  }, function() {
    this.emit('end');
  });
}

function waitForAll() {
  var all = [];
  return through.obj(function(chunk, enc, cb) {
    all.push(chunk);
    cb();
  }, function() {
    this.push(all);
    this.push(null);
  });
}

function resolveTarget(file) {
  var ext = path.extname(file);
  if (!ext) {
    var dirname = path.dirname(file);
    var basename = path.basename(file, ext);
    // i.e. /pages/contact
    return path.join("/", dirname, basename, "index.html");
  }
  return path.join("/", file);
}