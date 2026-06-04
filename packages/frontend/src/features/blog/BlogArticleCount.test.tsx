import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BlogArticleCount } from './BlogArticleCount'

afterEach(() => {
  cleanup()
})

describe('BlogArticleCount — 件数表示', () => {
  it('検索もタグ絞り込みもない場合は「全N件」を表示する', () => {
    render(<BlogArticleCount count={12} searchQuery="" hasTagFilter={false} />)
    expect(screen.getByText('全12件')).toBeInTheDocument()
  })

  it('検索語がある場合は検索結果の件数を表示する', () => {
    render(
      <BlogArticleCount count={3} searchQuery="React" hasTagFilter={false} />,
    )
    expect(screen.getByText('「React」の検索結果: 3件')).toBeInTheDocument()
  })

  it('タグ絞り込みのみの場合は絞り込み結果の件数を表示する', () => {
    render(<BlogArticleCount count={5} searchQuery="" hasTagFilter={true} />)
    expect(screen.getByText('絞り込み結果: 5件')).toBeInTheDocument()
  })

  it('検索語とタグ絞り込みが同時の場合は検索結果を優先表示する', () => {
    render(
      <BlogArticleCount count={2} searchQuery="Hono" hasTagFilter={true} />,
    )
    expect(screen.getByText('「Hono」の検索結果: 2件')).toBeInTheDocument()
  })

  it('件数が0の場合は何も表示しない', () => {
    const { container } = render(
      <BlogArticleCount count={0} searchQuery="" hasTagFilter={false} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
