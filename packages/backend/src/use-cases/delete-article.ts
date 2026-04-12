import type { PublicArticleId } from '../domain/models/article'
import type { ArticleRepository } from '../domain/ports/article-repository'
import type { BodyKeyDeletionQueue } from '../domain/ports/body-key-deletion-queue'
import type { BodyStorage } from '../domain/ports/body-storage'

export type DeleteArticleResult =
  | { status: 'deleted' }
  | { status: 'not_found' }

export async function deleteArticle(
  publicId: PublicArticleId,
  deps: {
    repository: ArticleRepository
    bodyStorage: BodyStorage
    bodyKeyDeletionQueue: BodyKeyDeletionQueue
    now: () => string
  },
): Promise<DeleteArticleResult> {
  const article = await deps.repository.findByPublicId(publicId)
  if (!article) return { status: 'not_found' }

  // D1を先に削除してユーザー視点の削除状態を確定させる
  await deps.repository.delete(article.id)

  // R2削除を試みる。失敗した場合はoutboxに記録してcronが再試行する
  try {
    await deps.bodyStorage.delete(article.bodyKey)
  } catch {
    await deps.bodyKeyDeletionQueue
      .enqueue(article.bodyKey, deps.now())
      .catch((queueErr) => {
        console.error(
          `クリーンアップキューへの追加も失敗: bodyKey=${article.bodyKey}`,
          queueErr,
        )
      })
  }

  return { status: 'deleted' }
}
