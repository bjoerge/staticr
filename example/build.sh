#!/bin/sh
NODE_ENV=production ../bin/build-static.js public sass-bundles.js browserify-bundles.js html-routes.js