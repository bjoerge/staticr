# Staticr example project

## Serve routes dynamically in development

```
NODE_ENV=development node ./server.js
```

## Build routes to static files for production

```
NODE_ENV=production ../../bin/staticr.js --out-dir ./public ./static-routes
```

The `./public` folder can now be served by your static web server of choice. For example, if you got python installed, cd to public and try:

```
python -m SimpleHTTPServer
```
