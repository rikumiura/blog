import { atom } from 'jotai'
import type { PublishedArticle } from '@/core/types/article'
import { blogApi } from './blog.api'

/** 公開記事一覧の状態 */
export const blogArticlesAtom = atom<PublishedArticle[]>([])

/** 選択中のタグ（フィルター用） */
export const blogSelectedTagsAtom = atom<string[]>([])

/** 全記事から重複なしのタグ一覧を派生 */
export const blogAllTagsAtom = atom((get) => {
  const articles = get(blogArticlesAtom)
  const tagSet = new Set<string>()
  for (const article of articles) {
    for (const tag of article.tags) {
      tagSet.add(tag)
    }
  }
  return [...tagSet].sort()
})

/** 選択タグで絞り込んだ記事一覧（未選択時は全件） */
export const blogFilteredArticlesAtom = atom((get) => {
  const articles = get(blogArticlesAtom)
  const selectedTags = get(blogSelectedTagsAtom)
  if (selectedTags.length === 0) return articles
  return articles.filter((article) =>
    selectedTags.some((tag) => article.tags.includes(tag)),
  )
})

/** ローディング状態 */
export const blogFetchLoadingAtom = atom(false)

/** エラー状態 */
export const blogErrorAtom = atom<string | null>(null)

/** 公開記事一覧を取得するアクション */
export const fetchBlogArticlesAtom = atom(null, async (_get, set) => {
  set(blogFetchLoadingAtom, true)
  set(blogErrorAtom, null)
  try {
    const articles = await blogApi.findAll()
    set(blogArticlesAtom, articles)
  } catch (error) {
    set(
      blogErrorAtom,
      error instanceof Error ? error.message : '記事一覧の取得に失敗しました',
    )
  } finally {
    set(blogFetchLoadingAtom, false)
  }
})
