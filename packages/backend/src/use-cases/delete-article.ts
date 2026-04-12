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
  },
): Promise<DeleteArticleResult> {
  const article = await deps.repository.findByPublicId(publicId)
  if (!article) return { status: 'not_found' }

  // D1の記事削除とoutboxへの bodyKey 記録を原子的に実行する。
  // どちらか片方が欠けた状態にならないため、クラッシュ時も cron による再試行が可能。
  await deps.repository.deleteAndEnqueueBodyKey(
    article.id,
    article.bodyKey,
    deps.now(),
  )

  // R2削除をbest-effortで試みる。失敗してもoutbox経由でcronが再試行する。
  await deps.bodyStorage.delete(article.bodyKey).catch((e) => {
    console.error(`R2削除失敗: bodyKey=${article.bodyKey}`, e)
  })

  return { status: 'deleted' }
}
