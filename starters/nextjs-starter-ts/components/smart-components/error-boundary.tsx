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
  <T extends Record<string, unknown>>(
    Component: React.ComponentType<T>,
  ): ((props: unknown) => React.JSX.Element) =>
  (props: unknown) => (
    <SmartComponentSuspenseErrorBoundary>
      <Component {...(props as T)} />
    </SmartComponentSuspenseErrorBoundary>
  );

export default SmartComponentErrorBoundary;
