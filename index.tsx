import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Minimal polyfill for dependencies that strictly require 'global' to exist
if (typeof window !== 'undefined') {
  (window as any).global = window;
}

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}