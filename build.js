
var mkdirp = require("mkdirp");
var path = require("path");
var fs = require("fs");
var es = require("event-stream");
var through = require("through2");
var str = require("string-to-stream");

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
  return Object.keys(routes).map(function(route) {
    var target = path.join(targetDir, resolveTarget(route));
    var tmpfile = target + TEMPFILE_SUFFIX;
    return {
      route: path.join('/', route),
      target: target,
      tmpfile: tmpfile,
      factory: routes[route]
    }
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

    function getValueFromFactory(cb) {
      if (route.factory.length == 1) {
        // Expects callback
        try {
          return route.factory(cb);
        } catch(e) {
          return cb(e);
        }
      }
      var retval;
      try {
        retval = route.factory();
      }
      catch(e) {
        return cb(e);
      }
      if (retval === undefined) {
        return cb(new Error("The factory function for '"+route.path+"' must either take a callback or return a value"));
      }
      if (typeof retval.then == 'function') {
        // Assume promise
        retval.then(cb.bind(null, null));
        retval.catch && retval.catch && retval.catch(cb);
        return;
      }
      // All other values (streams, buffers, strings, etc.)
      cb(null, retval);
    }

    getValueFromFactory(function(err, retval) {
      var stream = typeof retval === 'string' ? str(retval) : retval;
      if (typeof stream.pipe != 'function') {
        return cb(new Error('Expected a string or a readable stream to be returned from route build function for '+route.path));
      }
      stream
        .pipe(fs.createWriteStream(route.tmpfile))
        .on('error', this.emit.bind(this, 'error'))
        .on('close', this.push.bind(this, route))
        .on('close', cb);
    }.bind(this));
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
          return self.emit('error')
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