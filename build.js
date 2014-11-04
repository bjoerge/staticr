
var mkdirp = require("mkdirp");
var path = require("path");
var fs = require("fs");
var es = require("event-stream");
var through = require("through2");

module.exports = build;

function build(routes, targetDir) {
  return es
    .readArray(prepareRoutes(routes, targetDir))
    .pipe(ensurePaths())
    .pipe(writeToTempfile())
    .pipe(waitForAll())
    .pipe(atomicRename())
}

function ensurePaths() {
  return through.obj(function(route, enc, cb) {
    mkdirp(path.dirname(route.target), function() {
      cb(null, route);
    });
  })
}

function writeToTempfile() {
  return through.obj(function(route, enc, cb) {
    route.factory()
      .pipe(fs.createWriteStream(route.tmpfile))
      .on('close', this.push.bind(this, route))
      .on('error', this.emit.bind(this, 'error'))
      .on('close', cb);
  })
}

function atomicRename() {
  return through.obj(function(route, enc, cb) {
    fs.rename(route.tmpfile, route.target, function (err) {
      if (err) {
        return this.emit('error')
      }
      cb(null, route);
    }.bind(this));
  })
}

function waitForAll() {
  var data = [];
  return through.obj(function(chunk, enc, cb) {
    cb(null, chunk);
  }, function() {
    data.forEach(this.push.bind(this));
  })
}

function prepareRoutes(routes, targetDir) {
  return Object.keys(routes).map(function(route) {
    var target = path.join(targetDir, resolveTarget(route));
    var tmpfile = target + '.tmp';
    return {
      route: path.join('/', route),
      target: target,
      tmpfile: tmpfile,
      factory: routes[route]
    }
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
