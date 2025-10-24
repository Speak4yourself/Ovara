import React from 'react'
import PropTypes from 'prop-types'

/**
 * Error Boundary component to catch React errors and display fallback UI
 * Prevents the entire app from crashing when a component errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6 flex items-center justify-center">
          <div className="max-w-2xl w-full">
            <div className="rounded-2xl border bg-red-500/10 border-red-500/20 p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h1 className="text-3xl font-bold text-red-300 mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-white/70">
                  Don't worry, your data is safe. Try reloading the page or going back.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-6 p-4 bg-black/20 rounded-lg">
                  <p className="text-sm font-mono text-red-300 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-white/50 overflow-auto max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-md transition"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 border border-white/10 hover:bg-white/5 text-white rounded-md transition"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onReset: PropTypes.func,
}

export default ErrorBoundary
