import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import '../examples/Wildfire'
import '../examples/UncertaintyTube'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialConfig="ScenarioConfigs/Wildfire.json" />
  </StrictMode>,
)
