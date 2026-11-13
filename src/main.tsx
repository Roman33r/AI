import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/noto-sans'
import '@fontsource-variable/noto-sans-display'
import '@fontsource-variable/antonio'
import '@fontsource/dm-mono/400.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
