import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// --- RESCUE LOGGER: Writes errors to the screen even if React fails ---
window.onerror = function (msg, url, lineNo, columnNo, error) {
  const container = document.getElementById('debug-error-overlay') || document.createElement('div');
  container.id = 'debug-error-overlay';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.background = '#ffebee';
  container.style.color = '#b71c1c';
  container.style.padding = '20px';
  container.style.zIndex = '999999';
  container.style.fontSize = '14px';
  container.style.fontFamily = 'monospace';
  container.style.whiteSpace = 'pre-wrap';

  const text = `Runtime Error: ${msg}\nFile: ${url}\nLine: ${lineNo}: ${columnNo}\nStack: ${error?.stack}`;
  container.innerText = text;
  document.body.appendChild(container);
  return false;
};
// -------------------------------------------------------------------

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h1>Something went wrong (React Boundary).</h1>
          <pre>{this.state.error?.toString()}</pre>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ marginTop: 20, padding: 10 }}>
            Clear Data & Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error("Root element not found");

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
} catch (e) {
  console.error("Top-level mount error:", e);
  document.body.innerHTML += `<div style="color:red; padding:20px;"><h1>Top Level Error</h1><pre>${e}</pre></div>`;
}
