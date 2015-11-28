# Changelog

## 3.1.1
* Update examples and make text/html default mime type for extension-less routes, (e.g. `/foo`) as these will be compiled to `<route>/index.html` (e.g. `/foo/index.html`) 

## 3.1.0
* Use interop-require for babel6 compat.
* Minor logging improvement

## 3.0.1
* Readme tweaks

## 3.0.0
* [BREAKING] Specify output directory using --out-dir instead of first command line argument
* Improve error handling and add more tests