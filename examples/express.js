var path = require("path");
var express = require("express");

var app = express();

if (process.env.NODE_ENV === 'development') {
  var serve = require("../");
  var bundles = require("./browserify-bundles");
  app.use("/js", serve(bundles));
}

app.use(express.static(path.join(__dirname, 'public')));


app.listen(3000, function(err) {
  if (err) {
    throw err;
  }
  if (process.env.NODE_ENV === 'development') {
    console.log("Serving bundles at http://localhost:3000/js")
    Object.keys(bundles).forEach(function(path) {
      console.log(" => http://localhost:3000/js%s", path);
    })
  }
  else {
    console.log("No bundles served. NODE_ENV != development.")
  }
});