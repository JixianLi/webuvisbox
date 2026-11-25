// ABOUTME: Dev-app entry point: mounts the app on the built-in ChatUI example. App registers the built-in examples;
// ABOUTME: a dev-only scenario would be imported here to register it.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/App'
import { CHAT_UI_CONFIG } from '@/Examples'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialConfig={CHAT_UI_CONFIG} />
  </StrictMode>,
)
