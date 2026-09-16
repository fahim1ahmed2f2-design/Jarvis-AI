import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[JARVIS UI CRITICAL ERROR]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#020617',
          color: '#f0fdff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Share Tech Mono', monospace",
          padding: '2rem',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}>
          <div style={{
            border: '1px solid #ef4444',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            padding: '2rem',
            maxWidth: '650px',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.25)'
          }}>
            <div style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', letterSpacing: '0.1em' }}>
              // CRITICAL SUBSYSTEM RECOVERY //
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              JARVIS encountered an unexpected runtime exception in the rendering pipeline.
            </p>
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: '1rem',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.85rem',
              color: '#fca5a5',
              textAlign: 'left',
              overflowX: 'auto',
              marginBottom: '1.5rem',
              maxHeight: '200px'
            }}>
              {this.state.error?.toString() || 'Unknown Error'}
            </div>
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#00f0ff',
                color: '#020617',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)'
              }}
            >
              REINITIALIZE JARVIS OS
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
