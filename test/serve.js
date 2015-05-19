var test = require("tap").test;
var concat = require("concat-stream");
var str = require("string-to-stream");
var serve = require("../serve");

test("serving bundles as express middleware", function (t) {
  t.test('serving js files', function (t) {
    var routes = {
      '/foo.js': function () {
        return str("foo")
      },
      '/bar.js': function () {
        return str("bar")
      },
      '/bar/baz.js': function () {
        return str("bar baz")
      }
    };

    var middleware = serve(routes);

    [
      ['/foo.js', 'foo'],
      ['/bar.js', 'bar'],
      ['/bar/baz.js', 'bar baz']
    ]
      .forEach(function (row) {
        var path = row[0];
        var expectedResponse = row[1];
        t.test('fetching ' + path, function (t) {
          t.plan(2);

          var mockResponse = concat(function (response) {
            t.equal(response.toString(), expectedResponse);
            t.end();
          });

          mockResponse.type = function (type) {
            t.equal('application/javascript', type);
          };

          var mockRequest = {path: path};
          middleware(mockRequest, mockResponse, function () {
            // Will abort early and fail planned number
            t.fail("Expected " + path + " to return " + expectedResponse);
            t.end();
          });
        });
      });
  });
  t.test('mime types', function (t) {
    var routes = {
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

    var expectations = {
      '/foo.js': 'application/javascript',
      '/bar.html': 'text/html',
      '/bar/baz.woff': 'application/font-woff'
    };

    Object.keys(expectations)
      .forEach(function (path) {
        var mime = expectations[path];
        t.test('fetching ' + path, function (t) {
          t.plan(1);

          var mockResponse = concat(function (response) {});

          mockResponse.type = function (type) {
            t.equal(type, mime);
            t.end();
          };

          var mockRequest = {path: path};
          middleware(mockRequest, mockResponse, function (err) {
            // Will abort early and fail planned number
            t.fail(err);
            t.end();
          });
        });
      });
  });
});