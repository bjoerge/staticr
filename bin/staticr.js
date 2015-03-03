#!/usr/bin/env node
var path = require("path");

var build = require("../build");
var filesize = require("filesize");
var through = require("through2");
var fs = require("fs");
var xtend = require("xtend");
var clc = require("cli-color");
var minimist = require("minimist");
var getFactoryStream = require("../lib/getFactoryStream");
var createRoutes = require("../lib/createRoutes");
var normalizePath = require("../lib/normalizePath");

var argv = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    r: 'route',
    m: 'require',
    e: 'exclude',
    s: 'stdout'
  }
});

function showHelp() {
  process.stdout.write(fs.readFileSync(__dirname+"/usage.txt"));
}

if (argv.help) {
  showHelp();
  process.exit(0)
}

const cwd = process.cwd();
module.paths.push(cwd, path.join(cwd, 'node_modules'));
[].concat(argv.require || []).map(function(mod) {
  if (fs.existsSync(mod) || fs.existsSync(mod+'.js')) {
    return path.resolve(mod);
  }
  return mod;
}).forEach(require);

if (!argv.stdout && argv._.length < 2) {
  console.log("Error: Please specify either --stdout or a target folder. See staticr --help for more information.");
  process.exit(1)
}

var targetDir = argv._[0];
var routeFiles = argv.stdout ? argv._.slice(0) : argv._.slice(1);

var include = [].concat(argv.route || []).map(normalizePath);
var exclude = [].concat(argv.exclude || []).map(normalizePath);

if (include.length > 0 && exclude.length > 0 ) {
  console.log("Error: The --route and --exclude options are mutually exclusive.");
  process.exit(1);
}

var routesMap = xtend.apply(xtend, routeFiles.map(function(file) {
  return require(path.join(process.cwd(), file))
}));

var routes = createRoutes(routesMap);

var filtered = routes.filter(function(route) {
  return ((include.length == 0 && exclude.length == 0)
      || (include.length > 0 && include.indexOf(route.path) > -1)
      || (exclude.length >   0 && exclude.indexOf(route.path) === -1));
});

if (filtered.length == 0) {
  console.log("Error: No routes to build.");
  process.exit(1);
}

if (argv.stdout && filtered.length !== 1) {
  console.log("Error: The --stdout option can only be used for a single route. The -r option specifies the route to build");
  process.exit(1);
}

if (argv.stdout) {
  getFactoryStream(filtered[0], function(err, value) {
    if (err) {
      throw err;
    }
    value.pipe(process.stdout)
      .on('error', function (error) {
        throw error;
      });
  });
}
else {
  build(filtered, targetDir)
    .pipe(stat())
    .pipe(prettify())
    .pipe(process.stdout)
    .on('error', function (error) {
      throw error;
    });
}

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
