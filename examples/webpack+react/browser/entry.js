import 'babel-polyfill'
import domready from 'domready'
import React from 'react'
import ReactDOM from 'react-dom'
import HelloWorld from '../components/HelloWorld'

domready(bootstrap)

function bootstrap() {
  ReactDOM.render(<HelloWorld/>, document.getElementById('content'))
}

