
var mkdirp = require("mkdirp");
var path = require("path");
var fs = require("fs");
var es = require("event-stream");
var through = require("through2");
var xtend = require("xtend");
var combine = require("stream-combiner");
var getFactoryStream = require("./lib/getFactoryStream");

var TEMPFILE_SUFFIX = '.staticr-tmp';

module.exports = build;

function build(routes, targetDir) {
  return combine(
    es.readArray(prepareRoutes(routes, targetDir)),
    ensurePaths(),
    writeToTempfile(),
    waitForAll(),
    atomicRename()
  )
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
    mkdirp(path.dirname(route.target), function(err) {
      if (err) {
        return cb(err)
      }
      cb(null, route);
    });
  });
}

function writeToTempfile() {
  return through.obj(function(route, enc, cb) {
    var factoryStream = getFactoryStream(route)
    var writeStream = fs.createWriteStream(route.tmpfile)
    factoryStream.on('error', cb)
    writeStream.on('error', cb)
    writeStream.on('finish', function() {
      cb(null, route)
    })
    factoryStream.pipe(writeStream)
  })
}

function atomicRename() {
  return through.obj(function(routes, enc, cb) {

    var pending = routes.length;
    var errored = false
    routes.forEach(function(route) {
      fs.rename(route.tmpfile, route.target, function (err) {
        if (errored) {
          return // avoid multiple calls to callback
        }
        pending--
        if (err) {
          errored = true
          return cb(err)
        }
        this.push(route);
        if (pending === 0) {
          cb(null, route);
        }
      }.bind(this));
    }.bind(this));
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