import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Unhandled error in component tree:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-5 px-6 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-gray-100">Etwas ist schiefgelaufen</p>
            <p className="text-sm text-gray-500 max-w-sm">
              Es ist ein unerwarteter Fehler aufgetreten. Bitte lade die Seite neu — sollte das Problem
              bestehen bleiben, kontaktiere bitte das Team.
            </p>
          </div>
          <Button onClick={this.handleReload}>Seite neu laden</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
