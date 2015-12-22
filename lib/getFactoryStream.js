var through = require('through2');
var combine = require('stream-combiner');
var isPromise = require('is-promise');
var isStream = require('is-stream');

module.exports = getFactoryStream;

function resolveFactoryValue(factoryFn, callback) {
  if (factoryFn.length == 1) {
    // The factory function expects a callback
    try {
      factoryFn(callback);
    } catch (error) {
      callback(error);
    }
    return
  }

  var returnValue;
  try {
    returnValue = factoryFn();
  }
  catch (error) {
    return callback(error);
  }

  if (isPromise(returnValue)) {
    returnValue.then(
      function (value) {
        // Stay clear of the promise call stack
        process.nextTick(callback.bind(null, null, value))
      },
      function (error) {
        // Stay clear of the promise call stack
        process.nextTick(callback.bind(null, error))
      }
    );
    return
  }

  callback(null, returnValue)
}

function getFactoryStream(route) {

  process.on('exit', detectMissingCallback)

  var stream = through()
  resolveFactoryValue(route.factory, function (error, resolvedValue) {

    process.removeListener('exit', detectMissingCallback)

    if (error) {
      stream.emit('error', error)
      return
    }

    if (isStream(resolvedValue)) {
      combine(resolvedValue, stream)
      return
    }

    if (typeof resolvedValue === 'string' || Buffer.isBuffer(resolvedValue)) {
      stream.end(resolvedValue.toString())
      return
    }

    stream.emit('error', new Error('The factory function must resolve to either a stream, promise, string or buffer. Got '+JSON.stringify(resolvedValue)))
  })

  return stream

  function detectMissingCallback() {
    throw new Error('Building static route `' + route.path + '` ended prematurely. This is most likely due to a callback never being called ' +
      'in the route factory. Please inspect the function: \n\n' + route.factory.toString())
  }

}