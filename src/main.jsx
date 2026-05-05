import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './wireframe.css'
import App from './App.jsx'

// ============================================
// SECURITY: Anti-DevTools (Production Only)
// ============================================
if (import.meta.env.PROD) {
  // Block right click
  document.addEventListener('contextmenu', event => event.preventDefault()); 
  
  document.addEventListener('keydown', function(e) {
    // Block F12
    if (e.key === 'F12' || e.keyCode === 123) e.preventDefault();
    // Block Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element Inspector)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) e.preventDefault();
    // Block Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') e.preventDefault();
  });

  // Anti-Debugger loop (creates infinite loop if devtools is open)
  setInterval(function() {
    var start = new Date();
    debugger;
    var end = new Date();
    if (end - start > 100) {
       document.body.innerHTML = "<h1 style='text-align:center;margin-top:20vh;font-family:sans-serif;'>Access Denied. DevTools is disabled.</h1>";
    }
  }, 1000);
}

// Wireframe mode: add ?wireframe to URL to activate
if (window.location.search.includes('wireframe')) {
  document.documentElement.setAttribute('data-wireframe', 'true');
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Balsamiq+Sans:wght@400;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

// ============================================
// FIX: Handle Supabase OAuth redirect with HashRouter
// ============================================
// Supabase OAuth returns: /iteracurs/#access_token=xxx&...
// But HashRouter expects: /iteracurs/#/route
// When the hash contains access_token, we need to convert it
// so Supabase can parse it properly.
const hash = window.location.hash;
if (hash && hash.includes('access_token=') && !hash.startsWith('#/')) {
  // The token is in the hash fragment. Supabase's createClient
  // auto-detects this from the URL. We just need to make sure
  // the hash doesn't interfere with routing.
  // After Supabase parses the session (in AuthContext), the URL
  // will be cleaned up by replacing the hash with #/
  // We do this cleanup after a short delay to let Supabase parse first.
  setTimeout(() => {
    window.location.hash = '#/';
  }, 1000);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
