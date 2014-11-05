#!/usr/bin/env node
var path = require("path");

var build = require("../build");
var filesize = require("filesize");
var through = require("through2");
var fs = require("fs");
var xtend = require("xtend");
var clc = require("cli-color");
var minimist = require("minimist");

var argv = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    r: 'route',
    e: 'exclude'
  }
});

function showHelp() {
  process.stdout.write(fs.readFileSync(__dirname+"/usage.txt"));
}

if (argv.help || argv._.length < 2) {
  showHelp();
  process.exit(1)
}

var targetDir = argv._[0];
var routeFiles = argv._.slice(1);

var include = [].concat(argv.route || []);
var exclude = [].concat(argv.exclude || []);

if (include.length > 0 && exclude.length > 0 ) {
  console.log("Error: The --route and --exclude options are mutually exclusive");
  process.exit(1);
}

var routes = xtend.apply(xtend, routeFiles.map(function(file) {
  return require(path.join(process.cwd(), file))
}));

var filtered = Object.keys(routes).reduce(function(filtered, route) {
  if ((include.length == 0 && exclude.length == 0)
      || (include.length > 0 && include.indexOf(route) > -1)
      || (exclude.length >   0 && exclude.indexOf(route) === -1)) {
    filtered[route] = routes[route];
  }
  return filtered;
}, {}); 

build(filtered, targetDir)
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
