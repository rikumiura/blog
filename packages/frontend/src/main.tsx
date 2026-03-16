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
        {/* 管理画面 */}
        <Route path="/" element={<ArticlesPage />} />
        <Route path="/articles/new" element={<ArticleCreatePage />} />
        <Route path="/articles/:publicId" element={<ArticleDetailPage />} />
        <Route path="/articles/:publicId/edit" element={<ArticleEditPage />} />
        {/* 公開読者向け */}
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:publicId" element={<BlogArticlePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
