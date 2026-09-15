import { Component, type ErrorInfo, type ReactNode } from "react"

type Props = {
  children: ReactNode
  fallback?: ReactNode
  onError?: () => void
}

type State = {
  hasError: boolean
}

export class PaceuiErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError?.()
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}
