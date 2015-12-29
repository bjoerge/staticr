module.exports = function resolve () {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve({
        '/simple-async-promise.js': function () {
          return 'console.log("OMG SIMPLE PROMISE")'
        }
      })
    }, 100)
  })
}
