import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-3xl bg-card border border-red-500/30 text-center space-y-4 shadow-xl max-w-xl mx-auto my-12">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {this.props.fallbackTitle || 'Un problème temporaire est survenu'}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {this.state.error?.message || 'Une erreur inattendue est survenue dans cette section.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button onClick={this.handleReset} className="gap-1.5 text-xs bg-primary text-black font-bold">
              <RotateCcw className="w-3.5 h-3.5" /> Recharger la page
            </Button>
            <Button variant="outline" onClick={() => { window.location.href = '/' }} className="gap-1.5 text-xs">
              <Home className="w-3.5 h-3.5" /> Retour à l'accueil
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
