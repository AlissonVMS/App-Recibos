import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[App-Recibos ErrorBoundary]', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-slate-800">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Falha na Interface</h2>
              <p className="text-xs text-slate-500 mt-1">
                Ocorreu uma falha inesperada na renderização da aplicação.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                  Detalhes do Erro
                </span>
                <p className="text-xs font-mono text-red-600 break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recarregar Aplicação</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Limpar cache local e recarregar"
              >
                Restaurar Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
