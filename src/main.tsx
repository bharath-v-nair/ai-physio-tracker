import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { MotionConfig } from 'framer-motion'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Honour the user's reduce-motion setting for every animation */}
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
