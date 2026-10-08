import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Desativa o menu de contexto padrão do navegador (comportamento 100% nativo de desktop)
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Bloqueia atalhos de desenvolvedor e inspeção de código (F12, Ctrl+Shift+I/J/C, Ctrl+U)
window.addEventListener('keydown', (e) => {
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
    (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
  ) {
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
