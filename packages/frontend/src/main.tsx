import { Provider } from 'jotai'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { ArticleCreatePage } from '@/app/articles/ArticleCreatePage'
import { ArticleDetailPage } from '@/app/articles/ArticleDetailPage'
import { ArticleEditPage } from '@/app/articles/ArticleEditPage'
import { ArticlesPage } from '@/app/articles/ArticlesPage'
import { LoginPage } from '@/app/auth/LoginPage'
import { BlogArticlePage } from '@/app/blog/BlogArticlePage'
import { BlogPage } from '@/app/blog/BlogPage'
import { TagsPage } from '@/app/tags/TagsPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import './index.css'

// biome-ignore lint/style/noNonNullAssertion: root element always exists in index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider>
      <BrowserRouter>
        <Routes>
          {/* 公開読者向け */}
          <Route path="/" element={<BlogPage />} />
          <Route path="/articles/:publicId" element={<BlogArticlePage />} />
          {/* 認証 */}
          <Route path="/admin/login" element={<LoginPage />} />
          {/* 管理画面（認証必須） */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <ArticlesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/articles/new"
            element={
              <ProtectedRoute>
                <ArticleCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/articles/:publicId"
            element={
              <ProtectedRoute>
                <ArticleDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/articles/:publicId/edit"
            element={
              <ProtectedRoute>
                <ArticleEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tags"
            element={
              <ProtectedRoute>
                <TagsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
