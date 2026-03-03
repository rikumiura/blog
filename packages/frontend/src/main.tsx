import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import App from './app/App.tsx'
import { CompaniesTestPage } from './app/test/CompaniesTestPage.tsx'
import './index.css'

// biome-ignore lint/style/noNonNullAssertion: root element always exists in index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/test/companies" element={<CompaniesTestPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
