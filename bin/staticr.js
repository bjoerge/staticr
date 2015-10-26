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
var combine = require("stream-combiner");
var createRoutes = require("../lib/createRoutes");
var normalizePath = require("../lib/normalizePath");

var argv = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    r: 'route',
    o: 'out-dir',
    s: 'stdout',
    m: 'require',
    e: 'exclude'
  },
  unknown: function(opt) {
    if (opt.substring(0,2) === '--') {
      console.log("Error: Unknown option: "+opt);
      console.log();
      showHelp();
      process.exit(1);
    }
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

var outDir = argv['out-dir'];
if (!argv.stdout && !outDir) {
  console.log("Error: Please specify either --stdout or a output directory with --out-dir. See staticr --help for more information.");
  process.exit(1)
}

var routeFiles = argv._.slice(0);

var include = [].concat(argv.route || []).map(normalizePath);
var exclude = [].concat(argv.exclude || []).map(normalizePath);

if (include.length > 0 && exclude.length > 0 ) {
  console.log("Error: The --route and --exclude cannot be used together..");
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
  console.log("Error: No routes to build. Specify with `staticr <route file(s) ...>`");
  process.exit(1);
}

if (argv.stdout && filtered.length !== 1) {
  console.log("Error: The --stdout option can only be used for a single route. Specify a route with the --route option.");
  process.exit(1);
}

if (argv.stdout) {
  getFactoryStream(filtered[0], function(err, stream) {
    if (err) {
      throw err;
    }
    stream
      .pipe(process.stdout)
      .on('error', function (error) {
        throw error;
      });
  });
}
else {
  const pipeline = combine(
    build(filtered, outDir),
    stat(),
    prettify()
  )
  pipeline.on('error', function (error) {
    throw error; // build error
  });
  pipeline.pipe(process.stdout)
}

function stat() {
  return through.obj(function (route, enc, cb) {
    fs.stat(route.target, function(err, stat) {
      if (err) {
        return cb(err);
      }
      cb(null, {
        stat: stat,
        route: route
      });
    });
  })
}

function prettify() {
  return through.obj(function (result, enc, cb) {
    cb(null, [
      clc.green(" ✓ "),
      "Done building static route ",
      clc.whiteBright(result.route.route),
      " to ",
      clc.whiteBright(result.route.target),
      " ("+filesize(result.stat.size)+")\n"
    ].join(""));
  });
}
