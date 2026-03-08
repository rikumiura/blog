import { atom } from 'jotai'
import type { ArticleRepository } from '@/core/ports/article-repository'
import type { Article } from '@/core/types/article'
import type { Result } from '@/core/types/result'
import { articleApi } from './articles.api'

/** 記事リポジトリの依存注入用atom（テスト時に差し替え可能） */
export const articleRepositoryAtom = atom<ArticleRepository>(articleApi)

/** 記事一覧の状態 */
export const articlesAtom = atom<Article[]>([])

/** 操作ごとのローディング状態 */
export const fetchLoadingAtom = atom(false)
export const createLoadingAtom = atom(false)
export const publishLoadingAtom = atom(false)

/** エラー状態 */
export const articlesErrorAtom = atom<string | null>(null)

/** 記事一覧を取得して状態を更新するアクション */
export const fetchArticlesAtom = atom(null, async (get, set) => {
  set(fetchLoadingAtom, true)
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
    set(fetchLoadingAtom, false)
  }
})

/** 記事を作成して一覧に追加するアクション */
export const createArticleAtom = atom(
  null,
  async (
    get,
    set,
    input: { title: string; body: string },
  ): Promise<Result> => {
    set(createLoadingAtom, true)
    set(articlesErrorAtom, null)
    try {
      const repository = get(articleRepositoryAtom)
      await repository.create(input)
      await set(fetchArticlesAtom)
      return { status: 'success', data: undefined }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '記事の作成に失敗しました'
      set(articlesErrorAtom, message)
      return { status: 'error', error: message }
    } finally {
      set(createLoadingAtom, false)
    }
  },
)

/** 記事を公開するアクション */
export const publishArticleAtom = atom(
  null,
  async (get, set, publicId: string): Promise<Result> => {
    set(publishLoadingAtom, true)
    set(articlesErrorAtom, null)
    try {
      const repository = get(articleRepositoryAtom)
      await repository.publish(publicId)
      await set(fetchArticlesAtom)
      return { status: 'success', data: undefined }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '記事の公開に失敗しました'
      set(articlesErrorAtom, message)
      return { status: 'error', error: message }
    } finally {
      set(publishLoadingAtom, false)
    }
  },
)
