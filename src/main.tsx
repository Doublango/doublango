import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n' // Initialize i18n
import { AppSettingsProvider } from './contexts/AppSettingsContext'
import { FocusModeProvider } from './contexts/FocusModeContext'

createRoot(document.getElementById("root")!).render(
  <AppSettingsProvider>
    <FocusModeProvider>
      <App />
    </FocusModeProvider>
  </AppSettingsProvider>
);