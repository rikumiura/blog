import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MarkdownEditor } from './MarkdownEditor'

afterEach(() => cleanup())

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
