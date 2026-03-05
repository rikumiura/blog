import { atom } from 'jotai'
import type { ArticleRepository } from '@/core/ports/article-repository'
import type { Article } from '@/core/types/article'
import { articleApi } from './articles.api'

/** 記事リポジトリの依存注入用atom（テスト時に差し替え可能） */
export const articleRepositoryAtom = atom<ArticleRepository>(articleApi)

/** 記事一覧の状態 */
export const articlesAtom = atom<Article[]>([])

/** ローディング状態 */
export const articlesLoadingAtom = atom(false)

/** エラー状態 */
export const articlesErrorAtom = atom<string | null>(null)

/** 記事一覧を取得して状態を更新するアクション */
export const fetchArticlesAtom = atom(null, async (get, set) => {
  set(articlesLoadingAtom, true)
  set(articlesErrorAtom, null)
  try {
    const repository = get(articleRepositoryAtom)
    const articles = await repository.findAll()
    set(articlesAtom, articles)
  } catch (error) {
    set(
      articlesErrorAtom,
      error instanceof Error ? error.message : '記事一覧の取得に失敗しました',
    )
  } finally {
    set(articlesLoadingAtom, false)
  }
})

/** 記事を作成して一覧を再取得するアクション */
export const createArticleAtom = atom(
  null,
  async (get, set, input: { title: string; body: string }) => {
    set(articlesLoadingAtom, true)
    set(articlesErrorAtom, null)
    try {
      const repository = get(articleRepositoryAtom)
      await repository.create(input)
      const articles = await repository.findAll()
      set(articlesAtom, articles)
    } catch (error) {
      set(
        articlesErrorAtom,
        error instanceof Error ? error.message : '記事の作成に失敗しました',
      )
    } finally {
      set(articlesLoadingAtom, false)
    }
  },
)
