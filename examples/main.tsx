// ABOUTME: Dev-app entry point: mounts the app on the built-in Tornado ensemble example. App registers the built-in examples;
// ABOUTME: a dev-only scenario would be imported here to register it.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/App'
import { TORNADO_ENSEMBLE_CONFIG } from '@/Examples'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialConfig={TORNADO_ENSEMBLE_CONFIG} />
  </StrictMode>,
)
