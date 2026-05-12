import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { TagList } from './TagList'

const baseUrl = 'http://localhost:8787'

beforeAll(() => server.listen())
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

describe('TagList — タグ新規作成フォーム', () => {
  it('入力 → 送信で API が呼ばれ、一覧に新タグが追加される', async () => {
    const user = userEvent.setup()
    // 作成後の再フェッチで新タグが返ることを模擬するため、状態を保持する
    let stored: { id: string; name: string }[] = []
    server.use(
      http.get(`${baseUrl}/api/tags`, () => {
        return HttpResponse.json({ tags: stored })
      }),
      http.post(`${baseUrl}/api/tags`, async ({ request }) => {
        const body: unknown = await request.json()
        if (typeof body !== 'object' || body === null) {
          return HttpResponse.json({ error: 'Invalid body' }, { status: 400 })
        }
        const name = Reflect.get(body, 'name')
        if (typeof name !== 'string') {
          return HttpResponse.json({ error: 'Invalid body' }, { status: 400 })
        }
        const created = { id: 'tag-new', name }
        stored = [...stored, created]
        return HttpResponse.json(created, { status: 201 })
      }),
    )

    render(<TagList />)

    await waitFor(() => {
      expect(screen.getByText('タグはまだありません。')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('新しいタグ名')
    await user.type(input, 'React')
    await user.click(screen.getByRole('button', { name: '作成' }))

    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument()
    })
    expect(input).toHaveValue('')
  })

  it('409 エラー時はエラーメッセージを表示する', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(`${baseUrl}/api/tags`, () => {
        return HttpResponse.json({
          tags: [{ id: 'tag-1', name: 'React' }],
        })
      }),
      http.post(`${baseUrl}/api/tags`, () => {
        return HttpResponse.json(
          { error: '同名のタグが既に存在します' },
          { status: 409 },
        )
      }),
    )

    render(<TagList />)

    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('新しいタグ名'), 'React')
    await user.click(screen.getByRole('button', { name: '作成' }))

    await waitFor(() => {
      expect(screen.getByText('同名のタグが既に存在します')).toBeInTheDocument()
    })
  })

  it('空文字では送信ボタンが押せない', async () => {
    server.use(
      http.get(`${baseUrl}/api/tags`, () => {
        return HttpResponse.json({ tags: [] })
      }),
    )

    render(<TagList />)

    await waitFor(() => {
      expect(screen.getByText('タグはまだありません。')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: '作成' })).toBeDisabled()
  })
})
