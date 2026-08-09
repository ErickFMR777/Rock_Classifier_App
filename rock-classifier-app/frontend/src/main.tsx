import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { LocaleProvider } from './lib/i18n'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </React.StrictMode>,
)
