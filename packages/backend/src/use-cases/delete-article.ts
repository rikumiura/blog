import type { PublicArticleId } from '../domain/models/article'
import type { ArticleRepository } from '../domain/ports/article-repository'
import type { BodyStorage } from '../domain/ports/body-storage'

export type DeleteArticleResult =
  | { status: 'deleted' }
  | { status: 'not_found' }

export async function deleteArticle(
  publicId: PublicArticleId,
  deps: {
    repository: ArticleRepository
    bodyStorage: BodyStorage
    now: () => string
    waitUntil: (p: Promise<unknown>) => void
  },
): Promise<DeleteArticleResult> {
  const article = await deps.repository.findByPublicId(publicId)
  if (!article) return { status: 'not_found' }

  // D1の記事削除と現在の bodyKey の outbox 記録を原子的に実行する。
  // INSERT INTO pending SELECT body_key + DELETE を batch で行うため、
  // 呼び出し元が読んだ stale な bodyKey ではなく DB の現在の bodyKey が記録される。
  await deps.repository.deleteAndEnqueueBodyKey(article.id, deps.now())

  // R2削除をbest-effortで試みる。レスポンスをブロックしないよう waitUntil に渡す。
  // 失敗してもoutbox経由でcronが再試行する。
  deps.waitUntil(
    deps.bodyStorage.delete(article.bodyKey).catch((e) => {
      console.error(`R2削除失敗: bodyKey=${article.bodyKey}`, e)
    }),
  )

  return { status: 'deleted' }
}
