import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@pulse/ui";

interface Props {
  name: string;
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Isolates a federated remote. A remote that fails to load or throws while
 * rendering must never break the shell (§5) — we catch and show a fallback.
 */
export class RemoteErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[shell] remote "${this.props.name}" crashed`, error, info);
  }

  reset = (): void => this.setState({ error: null });

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm font-medium text-fg">
            The “{this.props.name}” module failed to load.
          </p>
          <p className="max-w-md text-xs text-fg-muted">
            It may be offline or still deploying. The rest of PulseHQ is unaffected.
          </p>
          <Button variant="outline" size="sm" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}