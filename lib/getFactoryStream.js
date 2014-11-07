var str = require("string-to-stream");

module.exports = getFactoryStream;

function getFactoryStream(route, callback) {
  if (route.factory.length == 1) {
    // Expects callback
    try {
      return route.factory(done);
    } catch(e) {
      return done(e);
    }
  }
  var retval;
  try {
    retval = route.factory();
  }
  catch(e) {
    return done(e);
  }
  if (retval === undefined) {
    return done(new Error("The factory function for '"+route.path+"' must either take a callback or return a value"));
  }
  if (typeof retval.then == 'function') {
    // Assume promise
    retval.then(done.bind(null, null));
    retval.catch && retval.catch && retval.catch(done);
    return;
  }

  // All other values (streams, buffers, strings, etc.)
  done(null, retval);

  function done(err, retval) {
    if (err) {
      return callback(err);
    }

    var stream = (retval.pipe && typeof retval.pipe == 'function') ? retval : str(''+retval);

    callback(null, stream);
  }
}