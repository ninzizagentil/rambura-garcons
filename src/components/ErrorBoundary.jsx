import { Component } from 'react';

/**
 * Catches render/lifecycle errors anywhere below it in the tree and shows a
 * visible fallback instead of letting React unmount to a blank white page.
 * Without this, any uncaught error (e.g. calling an array method on data
 * that hasn't loaded yet) silently produces a white screen with the real
 * error only visible in the browser console.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled error in UI:', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24,
          fontFamily: 'system-ui, sans-serif', textAlign: 'center', gap: 12,
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ color: '#666', maxWidth: 480 }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #ccc',
              background: '#111', color: '#fff', cursor: 'pointer', fontSize: 14,
            }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
