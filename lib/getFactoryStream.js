var str = require("string-to-stream");

module.exports = function getFactoryStream(route, cb) {
  if (route.factory.length == 1) {
    // Expects callback
    try {
      return route.factory(cb);
    } catch(e) {
      return cb(e);
    }
  }
  var retval;
  try {
    retval = route.factory();
  }
  catch(e) {
    return cb(e);
  }
  if (retval === undefined) {
    return cb(new Error("The factory function for '"+route.path+"' must either take a callback or return a value"));
  }
  if (typeof retval.then == 'function') {
    // Assume promise
    retval.then(gotValue);
    retval.catch && retval.catch && retval.catch(cb);
    return;
  }

  // All other values (streams, buffers, strings, etc.)
  gotValue(retval);

  function gotValue(retval) {
    var stream = typeof retval === 'string' ? str(retval) : retval;
    if (typeof stream.pipe != 'function') {
      return cb(new Error('Expected a string or a readable stream to be returned from route build function for '+route.path));
    }
    cb(null, retval);
  }
};