import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary caught rendering exception:', error, errorInfo);
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
            maxWidth: '480px',
            background: '#ffffff',
            padding: '36px 28px',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            border: '1px solid #e5dfd3'
          }}>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>🌸</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>Krishiv Corporation</h2>
            <p style={{ fontSize: '13px', color: '#666', fontFamily: 'sans-serif', marginBottom: '24px', lineHeight: '1.5' }}>
              We encountered a minor display update issue. Your cart and session are completely safe.
            </p>
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
                  this.setState({ hasError: false, error: null });
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
