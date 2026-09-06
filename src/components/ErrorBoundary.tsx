import { Component, ErrorInfo, ReactNode } from 'react';


interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'An unexpected error occurred' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[TypeRusher ErrorBoundary] Caught error:', error, errorInfo);
  }

  private handleRestart = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#faf9f6',
            color: '#111111',
            fontFamily: "'Courier Prime', monospace",
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', letterSpacing: '0.1em' }}>
            TYPE RUSHER
          </h1>
          <p style={{ fontSize: '1rem', color: '#666666', marginBottom: '2rem' }}>
            The session encountered a temporary issue.
          </p>
          <button
            type="button"
            onClick={this.handleRestart}
            style={{
              padding: '0.8rem 2rem',
              backgroundColor: '#111111',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            RESTART GAME
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
