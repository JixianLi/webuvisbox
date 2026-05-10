// ABOUTME: Dev-app entry point for the example scenarios.
// ABOUTME: Imports each example to trigger its registration, then mounts the app.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/App'
import './Wildfire'
import './UncertaintyTube'
import './ChatUI'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialConfig="ScenarioConfigs/ChatUI.json" />
  </StrictMode>,
)
