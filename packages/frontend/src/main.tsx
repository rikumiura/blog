import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { ArticleCreatePage } from './app/articles/ArticleCreatePage.tsx'
import { ArticlesPage } from './app/articles/ArticlesPage.tsx'
import { CompaniesTestPage } from './app/test/CompaniesTestPage.tsx'
import './index.css'

// biome-ignore lint/style/noNonNullAssertion: root element always exists in index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ArticlesPage />} />
        <Route path="/articles" element={<Navigate to="/" replace />} />
        <Route path="/articles/new" element={<ArticleCreatePage />} />
        <Route path="/test/companies" element={<CompaniesTestPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
