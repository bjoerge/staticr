var concat = require("concat-stream");
var serve = require("../serve");
var assert = require("assert");

describe("Serving bundles as express middleware", function () {

  describe('serving js files', function () {
    var routes = {
      '/foo.js': function () {
        return "foo"
      },
      '/bar/baz.js': function () {
        return "bar baz"
      }
    };

    var middleware = serve(routes);

    var expectations = [
      ['/foo.js', 'foo'],
      ['/bar/baz.js', 'bar baz']
    ];

    expectations.forEach(function (row) {
      var path = row[0];
      var expectedResponse = row[1];

      describe('fetching ' + path, function () {
        var actualResponse
        var actualType
        before(function(done) {
          var mockResponse = concat(function (response) {
            actualResponse = response
          });
          mockResponse.type = function (type) {
            actualType = type
          };

          var mockRequest = {path: path};
          middleware(mockRequest, mockResponse, function error() {
            assert.fail("Expected " + path + " to return " + expectedResponse);
          });

          mockResponse.on('finish', done)
        })
        it('writes the expected response', function() {
          assert.equal(expectedResponse, actualResponse.toString());
        })
        it('sets the expected content type', function() {
          assert.equal(actualType, 'application/javascript');
        })
      });
    });
  });

  describe('mime types', function () {
    var routes = {
      '/': function () {
        return ''
      },
      '/foo': function () {
        return ''
      },
      '/foo.js': function () {
        return ''
      },
      '/bar.html': function () {
        return ''
      },
      '/bar/baz.woff': function () {
        return ''
      }
    };

    var middleware = serve(routes);

    var expectations = [
      ['/', 'text/html'],
      ['/foo', 'text/html'],
      ['/foo.js', 'application/javascript'],
      ['/bar.html', 'text/html'],
      ['/bar/baz.woff', 'application/font-woff']
    ];

    expectations
      .forEach(function (expectation) {
        var path = expectation[0];
        var mime = expectation[1];

        it('responds with '+ mime + ' for path ' + path, function (done) {

          var mockResponse = concat(function() { done() });

          mockResponse.type = function (type) {
            assert.equal(type, mime);
          };

          var mockRequest = {path: path};
          middleware(mockRequest, mockResponse, assert.fail);
        });
      });
  });
});