
module.exports = function serveBundles(bundles, options) {
  options = options || {};
  return function serve(req, res, next) {
    res.type('application/javascript');
    var factory = bundles.hasOwnProperty(req.path) && bundles[req.path];
    if (!factory) {
      handleError(new Error("Bundle for request path " + JSON.stringify(req.path) + " not found"));
    }

    try {
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
    str += err.stack;
    str += "\n*/\n";
    str += "var e = new Error(" + JSON.stringify(err.message) + ");";
    if (err.stack) {
      str += "\ne.stack=" + JSON.stringify(err.stack) + ";";
    }
    str += "\nthrow e;";
    return str;
  }

};
