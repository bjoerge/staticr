#!/usr/bin/env node
var path = require("path");

var build = require("../build");
var filesize = require("filesize");
var through = require("through2");
var fs = require("fs");
var xtend = require("xtend");
var clc = require("cli-color");
var minimist = require("minimist");

var argv = minimist(process.argv.slice(2));

if (argv._.length < 2) {
  console.log("Usage: staticr <target dir> <route files ...>")
  process.exit(0);
}

var targetDir = argv._[0];
var routes = xtend.apply(xtend, argv._.slice(1).map(function(file) {
  return require(path.join(process.cwd(), file))
}));

build(routes, targetDir)
  .pipe(stat())
  .pipe(prettify())
  .pipe(process.stdout)
  .on('error', function (error) {
    throw error;
  });

function stat() {
  return through.obj(function (route, enc, cb) {
    fs.stat(route.target, function(err, stat) {
      if (err) {
        return this.emit(err);
      }
      this.push({
        stat: stat,
        route: route
      });
      cb();
    }.bind(this));
  })
}

function prettify() {
  return through.obj(function (result, enc, cb) {
    this.push([
      clc.green(" ✓ "),
      "Done building static route ",
      clc.whiteBright(result.route.route),
      " to ",
      clc.whiteBright(result.route.target),
      " ("+filesize(result.stat.size)+")\n"
    ].join("")); 
    cb();
  });
}
