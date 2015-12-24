var through = require('through2')
var isPromise = require('is-promise')
var isStream = require('is-stream')

module.exports = getFactoryStream

function streamifyFactoryCallback (route) {
  process.on('exit', detectPrematureExit)
  var stream = through()
  try {
    route.factory(gotValue)
  } catch (error) {
    gotValue(error)
  }

  function gotValue (error, passedValue) {
    process.removeListener('exit', detectPrematureExit)
    if (error) {
      stream.emit('error', error)
      return
    }
    if (typeof passedValue === 'string' || Buffer.isBuffer(passedValue)) {
      stream.end(passedValue.toString())
      return
    }
    throw new Error('The value passed to static route callback must be a string or buffer. Got ' + JSON.stringify(passedValue))
  }

  return stream

  function detectPrematureExit () {
    throw new Error('Building static routes ended prematurely. This is most likely due to a callback never being called ' +
      'in the route factory. Please examine the factory function for route "' + route.path + '": \n\n' + route.factory.toString() + '\n')
  }
}

function streamifyPromise (promise, route) {
  process.on('exit', detectPrematureExit)

  var stream = through()
  promise.then(
    function (resolvedValue) {
      process.removeListener('exit', detectPrematureExit)
      // Stay clear of the promise call stack
      process.nextTick(function () {
        if (typeof resolvedValue === 'string' || Buffer.isBuffer(resolvedValue)) {
          stream.end(resolvedValue.toString())
        }
      })
    },
    function (error) {
      process.removeListener('exit', detectPrematureExit)
      // Stay clear of the promise call stack
      process.nextTick(function () {
        stream.emit('error', error)
      })
    }
  )
  return stream

  function detectPrematureExit () {
    throw new Error('Building static routes ended prematurely. This is most likely due to a promise that never gets resolved ' +
      'in the route factory. Please examine the factory function for route "' + route.path + '": \n\n' + route.factory.toString() + '\n')
  }
}

function streamifyValue (value) {
  var str = through()

  str.end(value)

  return str
}

function streamifyError (error) {
  var str = through()
  process.nextTick(function () {
    str.emit('error', error)
  })
  return str
}

function getFactoryStream (route) {
  if (route.factory.length === 1) {
    return streamifyFactoryCallback(route)
  }
  var returnValue
  try {
    returnValue = route.factory()
  } catch (error) {
    return streamifyError(error)
  }

  if (isStream(returnValue)) {
    return returnValue
  }

  if (isPromise(returnValue)) {
    return streamifyPromise(returnValue, route)
  }

  return streamifyValue(returnValue)
}
