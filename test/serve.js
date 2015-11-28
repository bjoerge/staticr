var test = require("tap").test;
var concat = require("concat-stream");
var str = require("string-to-stream");
var serve = require("../serve");

test("serving bundles as express middleware", function (t) {
  t.plan(2)

  t.test('serving js files', function (t) {
    var routes = {
      '/foo.js': function () {
        return "foo"
      },
      '/bar/baz.js': function () {
        return "bar baz"
      }
    };

    var middleware = serve(routes);

    const expectations = [
      ['/foo.js', 'foo'],
      ['/bar/baz.js', 'bar baz']
    ];

    t.plan(expectations.length)
    expectations.forEach(function (row) {
      var path = row[0];
      var expectedResponse = row[1];

      t.test('fetching ' + path, function (t) {

        t.plan(2)
        var mockResponse = concat(function (response) {
          t.equal(response.toString(), expectedResponse);
        });

        mockResponse.type = function (type) {
          t.equal('application/javascript', type);
        };

        var mockRequest = {path: path};
        middleware(mockRequest, mockResponse, function () {
          t.fail("Expected " + path + " to return " + expectedResponse);
        });
      });
    });
  });

  t.test('mime types', function (t) {
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

    t.plan(expectations.length)

    expectations
      .forEach(function (expectation) {
        var path = expectation[0];
        var mime = expectation[1];

        t.test('fetching ' + path, function (t) {

          t.plan(1)
          var mockResponse = concat(function () {});

          mockResponse.type = function (type) {
            t.equal(type, mime);
          };

          var mockRequest = {path: path};
          middleware(mockRequest, mockResponse, function (err) {
            // Will abort early and fail planned number
            t.fail(err);
          });
        });
      });
  });
});