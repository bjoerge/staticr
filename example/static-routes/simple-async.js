module.exports = function resolve (callback) {
  setTimeout(function () {
    callback(null, {
      '/simple-async.js': function () {
        return 'console.log("OMG SIMPLE ASYNC")'
      }
    })
  }, 100)
}
