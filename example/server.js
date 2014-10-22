var path = require("path");
var express = require("express");

var app = express();

if (process.env.NODE_ENV === 'development') {
  var serve = require("../serve");
  app.use("/", serve.css(require("./sass-bundles")));
  app.use("/", serve.html(require("./html-routes")));
  app.use("/", serve.js(require("./browserify-bundles")));
}

app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, function(err) {
  if (err) {
    throw err;
  }
  if (process.env.NODE_ENV === 'development') {
    console.log("Serving bundles at http://localhost:3000")
  }
  else {
    console.log("No bundles served. NODE_ENV != development.")
  }
});