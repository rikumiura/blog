import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { ArticleCreatePage } from '@/app/articles/ArticleCreatePage'
import { ArticleDetailPage } from '@/app/articles/ArticleDetailPage'
import { ArticleEditPage } from '@/app/articles/ArticleEditPage'
import { ArticlesPage } from '@/app/articles/ArticlesPage'
import './index.css'

// biome-ignore lint/style/noNonNullAssertion: root element always exists in index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ArticlesPage />} />
        <Route path="/articles/new" element={<ArticleCreatePage />} />
        <Route path="/articles/:publicId" element={<ArticleDetailPage />} />
        <Route path="/articles/:publicId/edit" element={<ArticleEditPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
