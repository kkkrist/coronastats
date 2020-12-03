import React, { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError (error) {
    return { error }
  }

  componentDidCatch (error, info) {
    console.error(error, info)
  }

  render () {
    const { error } = this.state
    return error ? (
      <div>
        <div>
          <h1 style={{ color: 'red', fontSize: '1.25rem' }}>
            Es ist ein Fehler aufgetreten!
          </h1>
          <p>
            Bitte schicken Sie einen Screenshot dieser Meldung an{' '}
            <a href='mailto:bugs@mundpropaganda.net'>bugs@mundpropaganda.net</a>
            !
          </p>
          <p style={{ color: 'grey', wordBreak: 'break-all' }}>{error.stack}</p>
        </div>
      </div>
    ) : (
      this.props.children
    )
  }
}
