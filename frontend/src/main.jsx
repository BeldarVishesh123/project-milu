import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[CRITICAL REACT EXCEPTION]', error);
    console.error('[COMPONENT STACK]', errorInfo?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#fbf9f4',
          fontFamily: "'Playfair Display', serif",
          color: '#1a1a1a',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: '#ffffff',
            padding: '36px 28px',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            border: '1px solid #e5dfd3'
          }}>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>🌸</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>Krishiv Corporation</h2>
            <p style={{ fontSize: '13px', color: '#666', fontFamily: 'sans-serif', marginBottom: '20px', lineHeight: '1.5' }}>
              We encountered a display update issue. Your cart and session are safe.
            </p>

            {/* Error Debug Log Panel */}
            <div style={{ textAlign: 'left', marginBottom: '20px', background: '#fff5f5', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '10px', fontSize: '12px', color: '#991b1b', fontFamily: 'monospace' }}>
              <strong>Error Trace:</strong> {this.state.error?.toString() || 'Unknown Render Error'}
              {this.state.showDetails && this.state.errorInfo && (
                <pre style={{ marginTop: '8px', fontSize: '10.5px', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', background: '#fee2e2', padding: '8px', borderRadius: '6px' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
              <button 
                onClick={() => this.setState({ showDetails: !this.state.showDetails })} 
                style={{ display: 'block', marginTop: '6px', background: 'none', border: 'none', color: '#dc2626', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
              >
                {this.state.showDetails ? 'Hide Details ▲' : 'Show Technical Details ▼'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('krishiv_current_page');
                  } catch (e) {}
                  window.location.href = '/';
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  background: '#8f8269',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'sans-serif'
                }}
              >
                Return to Storefront Home
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  background: 'transparent',
                  color: '#8f8269',
                  border: '1.5px solid #8f8269',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'sans-serif'
                }}
              >
                Try Reloading View
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
