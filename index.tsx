import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Trigger the global red screen if React crashes deeply
      const errorMsg = this.state.error?.message || "Unknown React Error";
      const stack = this.state.error?.stack || "";
      // @ts-ignore
      if (window.showFatalError) window.showFatalError("React Rendering Error", `${errorMsg}\n\n${stack}`);
      
      return null;
    }

    return this.props.children;
  }
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );

  // Success! Remove the loader/error screen
  const statusEl = document.getElementById('app-status');
  if (statusEl) {
    statusEl.style.display = 'none';
  }

} catch (e: any) {
  console.error("Failed to mount React application:", e);
  // Re-throw to trigger global handler in index.html
  throw e;
}