"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type SceneBoundaryProps = {
  children: ReactNode;
  fallback: (reason: string, retry: () => void) => ReactNode;
};

type SceneBoundaryState = {
  error: string | null;
  attempt: number;
};

/** Keeps a WebGL failure contained so the rest of Orbitask stays usable. */
export default class SceneBoundary extends Component<
  SceneBoundaryProps,
  SceneBoundaryState
> {
  state: SceneBoundaryState = { error: null, attempt: 0 };
  private host: HTMLDivElement | null = null;

  static getDerivedStateFromError(error: unknown): Partial<SceneBoundaryState> {
    return {
      error: error instanceof Error ? error.message : "Kesalahan tak dikenal",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Scene 3D gagal dirender", error, info.componentStack);
    }
  }

  private setHost = (node: HTMLDivElement | null) => {
    if (this.host) {
      this.host.removeEventListener(
        "webglcontextlost",
        this.handleContextLost,
        true,
      );
    }
    this.host = node;
    node?.addEventListener("webglcontextlost", this.handleContextLost, true);
  };

  private handleContextLost = (event: Event) => {
    event.preventDefault();
    this.setState({ error: "Konteks grafis perangkat terputus." });
  };

  private retry = () => {
    this.setState((state) => ({ error: null, attempt: state.attempt + 1 }));
  };

  render() {
    if (this.state.error) {
      return <>{this.props.fallback(this.state.error, this.retry)}</>;
    }

    return (
      <div key={this.state.attempt} className="absolute inset-0" ref={this.setHost}>
        {this.props.children}
      </div>
    );
  }
}
