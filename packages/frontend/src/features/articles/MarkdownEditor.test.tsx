import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MarkdownEditor } from './MarkdownEditor'

vi.mock('./image.api', () => ({
  uploadImage: vi.fn(),
  toAbsoluteImageUrl: (url: string) => `http://localhost:8787${url}`,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('MarkdownEditor', () => {
  it('初期状態で編集タブが選択されている', () => {
    render(<MarkdownEditor value="" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.queryByTestId('preview-pane')).not.toBeInTheDocument()
  })

  it('プレビュータブに切り替えるとプレビューが表示される', async () => {
    const user = userEvent.setup()
    render(<MarkdownEditor value="# Hello" onChange={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'プレビュー' }))

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByTestId('preview-pane')).toBeInTheDocument()
    expect(
      screen.getByTestId('preview-pane').querySelector('h1'),
    ).toHaveTextContent('Hello')
  })

  it('分割タブに切り替えるとエディタとプレビューが並列表示される', async () => {
    const user = userEvent.setup()
    render(<MarkdownEditor value="# Split" onChange={() => {}} />)

    await user.click(screen.getByRole('button', { name: '分割' }))

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByTestId('preview-pane')).toBeInTheDocument()
  })

  it('bodyが空の場合プレビューに「本文がありません」が表示される', async () => {
    const user = userEvent.setup()
    render(<MarkdownEditor value="" onChange={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'プレビュー' }))

    expect(screen.getByText('本文がありません')).toBeInTheDocument()
  })

  it('編集タブでテキストを変更するとonChangeが呼ばれる', () => {
    const onChange = vi.fn()
    render(<MarkdownEditor value="" onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'hello' },
    })

    expect(onChange).toHaveBeenCalledWith('hello')
  })

  it('分割表示でテキストを変更するとonChangeが呼ばれる', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MarkdownEditor value="" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: '分割' }))
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'world' },
    })

    expect(onChange).toHaveBeenCalledWith('world')
  })

  it('画像ボタンをクリックしてファイルを選択するとアップロードされ本文に挿入される', async () => {
    const { uploadImage } = await import('./image.api')
    const mockUpload = vi.mocked(uploadImage)
    mockUpload.mockResolvedValue({
      key: 'abc123.png',
      url: '/api/public/images/abc123.png',
    })

    const onChange = vi.fn()
    render(<MarkdownEditor value="" onChange={onChange} />)

    const imageButton = screen.getByRole('button', { name: '画像挿入' })
    expect(imageButton).toBeInTheDocument()

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['data'], 'test.png', { type: 'image/png' })
    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(file)
      expect(onChange).toHaveBeenCalledWith(
        expect.stringContaining('![test.png]'),
      )
    })
  })

  it('本文末尾に改行がない場合は改行を挟んで画像を挿入する', async () => {
    const { uploadImage } = await import('./image.api')
    vi.mocked(uploadImage).mockResolvedValue({
      key: 'abc123.png',
      url: '/api/public/images/abc123.png',
    })

    const onChange = vi.fn()
    render(<MarkdownEditor value="既存の本文" onChange={onChange} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, new File(['data'], 'img.png', { type: 'image/png' }))

    await waitFor(() => {
      const called = onChange.mock.calls[0][0] as string
      expect(called).toBe('既存の本文\n![img.png](http://localhost:8787/api/public/images/abc123.png)')
    })
  })

  it('本文末尾が改行で終わる場合は余分な改行を入れない', async () => {
    const { uploadImage } = await import('./image.api')
    vi.mocked(uploadImage).mockResolvedValue({
      key: 'abc123.png',
      url: '/api/public/images/abc123.png',
    })

    const onChange = vi.fn()
    render(<MarkdownEditor value={'既存の本文\n'} onChange={onChange} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, new File(['data'], 'img.png', { type: 'image/png' }))

    await waitFor(() => {
      const called = onChange.mock.calls[0][0] as string
      expect(called).toBe('既存の本文\n![img.png](http://localhost:8787/api/public/images/abc123.png)')
    })
  })

  it('アップロード失敗時にエラーが表示される', async () => {
    const { uploadImage } = await import('./image.api')
    const mockUpload = vi.mocked(uploadImage)
    mockUpload.mockRejectedValue(new Error('アップロードエラー'))

    render(<MarkdownEditor value="" onChange={() => {}} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['data'], 'fail.png', { type: 'image/png' })
    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText(/アップロードエラー/)).toBeInTheDocument()
    })
  })

  it('XSS対策: スクリプトタグがサニタイズされる', async () => {
    const user = userEvent.setup()
    render(
      <MarkdownEditor
        value={'<script>alert("xss")</script>'}
        onChange={() => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'プレビュー' }))

    const preview = screen.getByTestId('preview-pane')
    expect(preview.querySelector('script')).toBeNull()
  })
})
