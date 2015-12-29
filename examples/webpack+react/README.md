# Staticr example project with webpack react + hot module reloading 

## Serve routes dynamically in development

```
NODE_ENV=development node ./server.js
```

The app should now be up and running at http://localhost:3000/

## Build routes to static files for production

```
NODE_ENV=production ../../bin/staticr.js --require babel-register --require babel-polyfill --out-dir ./public ./static-routes/*
```

The app can now be started in "production mode" with static routes served from disk instead:

```
NODE_ENV=production node ./server.js
```


