import React from 'react'
import ReactDOM from 'react-dom/server'
import Layout from './components/Layout'
import path from 'path'
import express from 'express'
import serve from '../../serve'
import webpack from 'webpack'

import webpackRoutes, {compiler} from './static-routes/webpack'
import webpackHotMiddleware from 'webpack-hot-middleware'

const app = express()

if (process.env.NODE_ENV === 'development') {
  app.use(webpackHotMiddleware(compiler))
  app.use(serve(webpackRoutes))
}

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  res.status(200)
    .send(ReactDOM.renderToStaticMarkup(<Layout/>))
})

app.listen(3000, err => {
  if (err) {
    throw err
  }
  if (process.env.NODE_ENV === 'development') {
    console.log('Serving bundles at http://localhost:3000')
  } else {
    console.log("No bundles served. Start with NODE_ENV=development if you'd like to serve bundles.")
  }
})
