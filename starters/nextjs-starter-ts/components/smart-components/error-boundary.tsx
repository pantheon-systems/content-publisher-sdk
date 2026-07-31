import React, { Component, Suspense } from "react";

interface Props {
  children: React.ReactNode;
}

export class SmartComponentErrorBoundary extends Component<Props> {
  state = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="my-2 text-gray-400">
          Something went wrong while rendering this smart component.
        </div>
      );
    }

    return this.props.children;
  }
}

const SmartComponentSuspenseErrorBoundary = ({ children }: Props) => {
  return (
    <SmartComponentErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </SmartComponentErrorBoundary>
  );
};

export const withSmartComponentErrorBoundary =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Component: React.ComponentType<any>): ((props: unknown) => React.JSX.Element) =>
  (props: unknown) => (
    <SmartComponentSuspenseErrorBoundary>
      <Component {...(props as Record<string, unknown>)} />
    </SmartComponentSuspenseErrorBoundary>
  );

export default SmartComponentErrorBoundary;
