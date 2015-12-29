import React, {PropTypes} from 'react'
import DOMContentLoadedFix from 'react-domcontentloaded'
import path from 'path'

const development = process.env.NODE_ENV === 'development'

export default React.createClass({
  displayName: 'Layout',
  render() {
    return (
      <html lang="nb">
      <head>
        <DOMContentLoadedFix/>
        <meta httpEquiv="X-UA-Compatible" content="IE=Edge"/>
        <meta charSet="UTF-8"/>
        <title>staticr example poject</title>
        <script src="/build/bundle.js" async/>
        {!development && <link rel="stylesheet" href="/build/styles.css"/>}
      </head>
      <body>
        <div id="content">loading…</div>
      </body>
      </html>
    )
  }
})
