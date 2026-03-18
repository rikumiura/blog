import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { ArticleCreatePage } from '@/app/articles/ArticleCreatePage'
import { ArticleDetailPage } from '@/app/articles/ArticleDetailPage'
import { ArticleEditPage } from '@/app/articles/ArticleEditPage'
import { ArticlesPage } from '@/app/articles/ArticlesPage'
import { BlogArticlePage } from '@/app/blog/BlogArticlePage'
import { BlogPage } from '@/app/blog/BlogPage'
import './index.css'

// biome-ignore lint/style/noNonNullAssertion: root element always exists in index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 公開読者向け */}
        <Route path="/" element={<BlogPage />} />
        <Route path="/articles/:publicId" element={<BlogArticlePage />} />
        {/* 管理画面 */}
        <Route path="/admin" element={<ArticlesPage />} />
        <Route path="/admin/articles/new" element={<ArticleCreatePage />} />
        <Route
          path="/admin/articles/:publicId"
          element={<ArticleDetailPage />}
        />
        <Route
          path="/admin/articles/:publicId/edit"
          element={<ArticleEditPage />}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
