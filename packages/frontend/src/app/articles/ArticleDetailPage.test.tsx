import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ArticleRepository } from '@/core/ports/article-repository'
import type { CommentRepository } from '@/core/ports/comment-repository'
import type { ArticleDetail } from '@/core/types/article'
import type { Comment } from '@/core/types/comment'
import { articleRepositoryAtom } from '@/features/articles/articles.atom'
import { commentRepositoryAtom } from '@/features/comments/comments.atom'
import { ArticleDetailPage } from './ArticleDetailPage'

afterEach(() => {
  cleanup()
})

const articleDetail: ArticleDetail = {
  publicId: 'pub-1',
  title: 'DI で表示する記事',
  body: '記事本文です',
  tags: ['React'],
  status: 'published',
  publishedAt: '2026-01-01T00:00:00.000Z',
  scheduledAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const comment: Comment = {
  id: 'comment-1',
  articleId: 'article-1',
  authorName: '読者A',
  content: '管理画面から見えるコメント',
  createdAt: '2026-01-02T00:00:00.000Z',
}

function makeArticleRepository(): ArticleRepository {
  return {
    findAll: vi.fn(),
    findByPublicId: vi.fn().mockResolvedValue(articleDetail),
    create: vi.fn(),
    update: vi.fn(),
    publish: vi.fn(),
    schedule: vi.fn(),
    cancelSchedule: vi.fn(),
    updateTags: vi.fn(),
    delete: vi.fn(),
  }
}

function makeCommentRepository(): CommentRepository {
  return {
    listByArticle: vi.fn().mockResolvedValue([comment]),
    post: vi.fn(),
    deleteComment: vi.fn(),
  }
}

function renderPage(
  articleRepository: ArticleRepository,
  commentRepository: CommentRepository,
) {
  const store = createStore()
  store.set(articleRepositoryAtom, articleRepository)
  store.set(commentRepositoryAtom, commentRepository)
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/admin/articles/pub-1']}>
        <Routes>
          <Route
            path="/admin/articles/:publicId"
            element={<ArticleDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('ArticleDetailPage — 依存注入', () => {
  it('注入したモックリポジトリから記事詳細とコメントを表示する', async () => {
    const articleRepository = makeArticleRepository()
    const commentRepository = makeCommentRepository()

    renderPage(articleRepository, commentRepository)

    await waitFor(() => {
      expect(screen.getByText('DI で表示する記事')).toBeInTheDocument()
    })
    expect(screen.getByText('記事本文です')).toBeInTheDocument()
    expect(screen.getByText('管理画面から見えるコメント')).toBeInTheDocument()
    expect(articleRepository.findByPublicId).toHaveBeenCalledWith('pub-1')
    expect(commentRepository.listByArticle).toHaveBeenCalledWith('pub-1')
  })
})
