var str = require("string-to-stream");
var isPromise = require('is-promise');
var isStream = require('is-stream');

module.exports = getFactoryStream;

function callFactory(factoryFn, callback) {
  if (factoryFn.length == 1) {
    // The factory function expects a callback
    try {
      return factoryFn(callback);
    } catch (e) {
      return callback(e);
    }
  }
  var returnValue;
  try {
    returnValue = factoryFn();
  }
  catch (e) {
    return callback(e);
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

function getFactoryStream(route, callback) {

  callFactory(route.factory, function (error, returnValue) {

    if (error) {
      return callback(error)
    }

    if (isStream(returnValue)) {
      return callback(null, returnValue)
    }

    if (typeof returnValue === 'string' || Buffer.isBuffer(returnValue)) {
      return callback(null, str(returnValue.toString()))
    }

    callback(new Error('The factory function must resolve to either a stream, string or buffer. Got '+JSON.stringify(returnValue)))
  })
}