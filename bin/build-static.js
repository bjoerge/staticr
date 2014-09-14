#!/usr/bin/env node
var path = require("path");

var build = require("../build");

var argv = require('minimist')(process.argv.slice(2));

if (argv._.length !== 2) {
  console.log("Usage: build-static <routes file> <target dir>")
  process.exit(1);
}

var routes = require(path.join(process.cwd(), argv._[0]));

var targetDir = argv._[1];

build(routes, targetDir, function(err, result) {
  console.log(err, result);
});

