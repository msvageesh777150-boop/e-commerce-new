import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("OmniBazaar ErrorBoundary caught an uncaught exception:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen bg-[#020408] text-frost flex items-center justify-center p-6 select-none font-mono">
          <div className="max-w-md w-full glassmorphic border border-red-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
              <span className="text-red-400 text-xl font-bold">!</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-widest font-display">System Grid Disrupted</h4>
              <p className="text-xs text-frost/45 mt-1">A quantum graphics or state rendering crash was intercepted.</p>
            </div>
            
            <div className="bg-black/40 rounded-xl p-3 border border-white/5 text-left overflow-auto max-h-40">
              <pre className="text-[10px] text-red-300 whitespace-pre-wrap break-all leading-normal font-mono">
                {this.state.error?.stack || this.state.error?.message || "Unknown error"}
              </pre>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="cursor-pointer text-[10px] uppercase tracking-wider font-bold bg-white/5 hover:bg-white/10 text-cyan-400 border border-cyan-400/30 rounded-lg px-4 py-2 transition-all duration-300"
            >
              Reboot Quantum Core
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
