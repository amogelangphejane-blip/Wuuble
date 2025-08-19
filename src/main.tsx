import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import DiagnosticMode from './components/DiagnosticMode.tsx'
import './index.css'

// Check if we should run in diagnostic mode
const isDiagnosticMode = window.location.search.includes('diagnostic=true') || window.location.hash.includes('diagnostic');

console.log('🚀 Main.tsx loading, diagnostic mode:', isDiagnosticMode);

createRoot(document.getElementById("root")!).render(
  isDiagnosticMode ? <DiagnosticMode /> : <App />
);
