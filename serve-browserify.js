
var ent = require("ent");

function safeStr(str) {
  return ent.encode(JSON.stringify(str));
}

module.exports = function serveBundles(bundles, options) {
  options = options || {};
  return function serve(req, res, next) {
    console.log(req.originalUrl)
    var factory = bundles.hasOwnProperty(req.path) && bundles[req.path];
    if (!factory) {
      handleError(new Error("Bundle for request path " + safeStr(req.path) + " not found"));
    }

    try {
      res.type('application/javascript');
      factory()
        .on('error', handleError)
        .pipe(res);
    }
    catch (e) {
      handleError(e);
    }

    function handleError(error) {
      if (options.throwErrors !== false) {
        return res
          .status(200)
          .send(makeThrowStatementFromError(error));
      }
      next(error);
    }
  };

  function makeThrowStatementFromError(err) {
    var str = "";
    str += "/*\n";
    str += JSON.stringify(safeStr(err.message));
    str += "*/\n";
    str += "var e = new Error(" + safeStr(err.message) + ");";
    if (err.stack) {
      str += "\ne.stack=" + safeStr(err.stack) + ";";
    }
    str += "\nthrow e;";
    return str;
  }

};
