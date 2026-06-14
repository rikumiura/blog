import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore, Provider } from 'jotai'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CommentRepository } from '@/core/ports/comment-repository'
import type { Comment } from '@/core/types/comment'
import { BlogCommentSection } from './BlogCommentSection'
import { commentRepositoryAtom } from './comments.atom'

afterEach(() => {
  cleanup()
})

function makeComment(overrides?: Partial<Comment>): Comment {
  return {
    id: 'comment-1',
    articleId: 'article-1',
    authorName: '読者A',
    content: 'はじめてのコメント',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderWithRepository(repository: CommentRepository) {
  const store = createStore()
  store.set(commentRepositoryAtom, repository)
  return render(
    <Provider store={store}>
      <BlogCommentSection publicId="pub-1" />
    </Provider>,
  )
}

describe('BlogCommentSection — 依存注入', () => {
  it('注入したモックリポジトリからコメント一覧を表示する', async () => {
    const repository: CommentRepository = {
      listByArticle: vi.fn().mockResolvedValue([makeComment()]),
      post: vi.fn(),
      deleteComment: vi.fn(),
    }

    renderWithRepository(repository)

    await waitFor(() => {
      expect(screen.getByText('はじめてのコメント')).toBeInTheDocument()
    })
    expect(repository.listByArticle).toHaveBeenCalledWith('pub-1')
  })

  it('コメント投稿時に注入したリポジトリの post が呼ばれ、一覧に追加される', async () => {
    const user = userEvent.setup()
    const posted = makeComment({
      id: 'comment-2',
      authorName: '読者B',
      content: '新しいコメント',
    })
    const repository: CommentRepository = {
      listByArticle: vi.fn().mockResolvedValue([]),
      post: vi.fn().mockResolvedValue(posted),
      deleteComment: vi.fn(),
    }

    renderWithRepository(repository)

    await waitFor(() => {
      expect(screen.getByLabelText('お名前')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('お名前'), '読者B')
    await user.type(screen.getByLabelText('コメント'), '新しいコメント')
    await user.click(screen.getByRole('button', { name: 'コメントを投稿' }))

    await waitFor(() => {
      expect(screen.getByText('新しいコメント')).toBeInTheDocument()
    })
    expect(repository.post).toHaveBeenCalledWith('pub-1', {
      authorName: '読者B',
      content: '新しいコメント',
    })
  })
})
