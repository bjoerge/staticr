import React from 'react'

import './HelloWorld.scss'

export default React.createClass({
  displayName: 'HelloWorld',
  render () {
    return (
      <div className="hello-world-component">
        <h1>Hello World!</h1>
        <p>It works!</p>
      </div>
    )
  }
})
