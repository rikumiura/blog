import { atom } from 'jotai'
import type { ArticleRepository } from '@/core/ports/article-repository'
import type { Article, UpdateArticleInput } from '@/core/types/article'
import type { Result } from '@/core/types/result'
import { articleApi } from './articles.api'

/** 記事リポジトリの依存注入用atom（テスト時に差し替え可能） */
export const articleRepositoryAtom = atom<ArticleRepository>(articleApi)

/** 記事一覧の状態 */
export const articlesAtom = atom<Article[]>([])

/** ページネーション状態 */
export const currentPageAtom = atom(1)
export const totalPagesAtom = atom(1)
export const totalCountAtom = atom(0)
export const pageLimitAtom = atom(20)

/** 選択中のタグ（フィルター用） */
export const selectedTagsAtom = atom<string[]>([])

/** 全記事から重複なしのタグ一覧を派生 */
export const allTagsAtom = atom((get) => {
  const articles = get(articlesAtom)
  const tagSet = new Set<string>()
  for (const article of articles) {
    for (const tag of article.tags) {
      tagSet.add(tag)
    }
  }
  return [...tagSet].sort()
})

/** 選択タグで絞り込んだ記事一覧（未選択時は全件） */
export const filteredArticlesAtom = atom((get) => {
  const articles = get(articlesAtom)
  const selectedTags = get(selectedTagsAtom)
  if (selectedTags.length === 0) return articles
  return articles.filter((article) =>
    selectedTags.some((tag) => article.tags.includes(tag)),
  )
})

/** 操作ごとのローディング状態 */
export const fetchLoadingAtom = atom(false)
export const createLoadingAtom = atom(false)
export const updateLoadingAtom = atom(false)
export const publishLoadingAtom = atom(false)
export const deleteLoadingAtom = atom(false)
export const scheduleLoadingAtom = atom(false)

/** エラー状態 */
export const articlesErrorAtom = atom<string | null>(null)

/** 記事一覧を取得して状態を更新するアクション */
export const fetchArticlesAtom = atom(null, async (get, set) => {
  set(fetchLoadingAtom, true)
  set(articlesErrorAtom, null)
  try {
    const repository = get(articleRepositoryAtom)
    const page = get(currentPageAtom)
    const limit = get(pageLimitAtom)
    const selectedTags = get(selectedTagsAtom)
    const result = await repository.findAll({
      page,
      limit,
      ...(selectedTags.length > 0 ? { tags: selectedTags } : {}),
    })
    set(articlesAtom, result.items)
    set(totalPagesAtom, result.totalPages)
    set(totalCountAtom, result.totalCount)
  } catch (error) {
    set(
      articlesErrorAtom,
      error instanceof Error ? error.message : '記事一覧の取得に失敗しました',
    )
  } finally {
    set(fetchLoadingAtom, false)
  }
})

/** ページを変更するアクション */
export const changePageAtom = atom(null, async (_get, set, page: number) => {
  set(currentPageAtom, page)
  await set(fetchArticlesAtom)
})

/** タグを切り替えるアクション（ページを1にリセットして再フェッチ） */
export const toggleTagAtom = atom(null, async (_get, set, tag: string) => {
  set(selectedTagsAtom, (prev) =>
    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
  )
  set(currentPageAtom, 1)
  await set(fetchArticlesAtom)
})

/** タグフィルターをクリアするアクション */
export const clearTagFilterAtom = atom(null, async (_get, set) => {
  set(selectedTagsAtom, [])
  set(currentPageAtom, 1)
  await set(fetchArticlesAtom)
})

/** 記事を作成して一覧に追加するアクション */
export const createArticleAtom = atom(
  null,
  async (
    get,
    set,
    input: { title: string; body: string; tags: string[]; publish?: boolean },
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

/** 記事を更新するアクション */
export const updateArticleAtom = atom(
  null,
  async (
    get,
    set,
    { publicId, input }: { publicId: string; input: UpdateArticleInput },
  ): Promise<Result> => {
    set(updateLoadingAtom, true)
    set(articlesErrorAtom, null)
    try {
      const repository = get(articleRepositoryAtom)
      await repository.update(publicId, input)
      return { status: 'success', data: undefined }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '記事の更新に失敗しました'
      set(articlesErrorAtom, message)
      return { status: 'error', error: message }
    } finally {
      set(updateLoadingAtom, false)
    }
  },
)

/** 記事を削除するアクション */
export const deleteArticleAtom = atom(
  null,
  async (get, set, publicId: string): Promise<Result> => {
    set(deleteLoadingAtom, true)
    set(articlesErrorAtom, null)
    try {
      const repository = get(articleRepositoryAtom)
      await repository.delete(publicId)
      await set(fetchArticlesAtom)
      return { status: 'success', data: undefined }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '記事の削除に失敗しました'
      set(articlesErrorAtom, message)
      return { status: 'error', error: message }
    } finally {
      set(deleteLoadingAtom, false)
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

/** 記事を予約公開するアクション */
export const scheduleArticleAtom = atom(
  null,
  async (
    get,
    set,
    { publicId, scheduledAt }: { publicId: string; scheduledAt: string },
  ): Promise<Result> => {
    set(scheduleLoadingAtom, true)
    set(articlesErrorAtom, null)
    try {
      const repository = get(articleRepositoryAtom)
      await repository.schedule(publicId, scheduledAt)
      await set(fetchArticlesAtom)
      return { status: 'success', data: undefined }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '予約公開の設定に失敗しました'
      set(articlesErrorAtom, message)
      return { status: 'error', error: message }
    } finally {
      set(scheduleLoadingAtom, false)
    }
  },
)

/** 予約公開を取消するアクション */
export const cancelScheduleAtom = atom(
  null,
  async (get, set, publicId: string): Promise<Result> => {
    set(scheduleLoadingAtom, true)
    set(articlesErrorAtom, null)
    try {
      const repository = get(articleRepositoryAtom)
      await repository.cancelSchedule(publicId)
      await set(fetchArticlesAtom)
      return { status: 'success', data: undefined }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '予約の取消に失敗しました'
      set(articlesErrorAtom, message)
      return { status: 'error', error: message }
    } finally {
      set(scheduleLoadingAtom, false)
    }
  },
)
