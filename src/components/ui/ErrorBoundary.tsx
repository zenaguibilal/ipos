
'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
          <div className="p-6 bg-destructive/10 rounded-full mb-6">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Une erreur est survenue</h2>
          <p className="text-muted-foreground mb-8 max-w-md italic">
            Le terminal iPOS a rencontré une exception imprévue. Les données souveraines sont protégées.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="rounded-2xl h-14 px-10 gap-3 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser le Terminal
          </Button>
        </div>
      );
    }

    return this.children;
  }
}
