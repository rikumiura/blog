import {
  type Article,
  type BodyKey,
  createTitle,
  type PublicArticleId,
  type Title,
  updateArticleContent,
} from '../domain/models/article'
import type { Tag } from '../domain/models/tag'
import type { ArticleRepository } from '../domain/ports/article-repository'
import type { BodyKeyDeletionQueue } from '../domain/ports/body-key-deletion-queue'
import type { BodyStorage } from '../domain/ports/body-storage'
import type { TagRepository } from '../domain/ports/tag-repository'
import { resolveTags } from './resolve-tags'

export type UpdateArticleResult =
  | { status: 'updated'; article: Article; body: string; tags: Tag[] }
  | { status: 'not_found' }
  | { status: 'body_not_found' }
  | { status: 'validation_error'; message: string }

export async function updateArticle(
  publicId: PublicArticleId,
  input: { title?: string; body?: string; tags?: string[] },
  deps: {
    repository: ArticleRepository
    bodyStorage: BodyStorage
    tagRepository: TagRepository
    bodyKeyDeletionQueue: BodyKeyDeletionQueue
    generateTagId: () => Tag['id']
    generateBodyKey: () => BodyKey
    now: () => string
  },
): Promise<UpdateArticleResult> {
  const article = await deps.repository.findByPublicId(publicId)
  if (!article) return { status: 'not_found' }

  // --- バリデーションフェーズ（書き込みの前にすべて検証する） ---

  let validatedTitle: Title | undefined
  if (input.title !== undefined) {
    const titleResult = createTitle(input.title)
    if (!titleResult.ok) {
      return { status: 'validation_error', message: titleResult.message }
    }
    validatedTitle = titleResult.value
  }

  // NOTE: resolveTags は未知のタグ名を永続化する（upsert）。
  // バリデーション失敗時に孤立タグが残る可能性があるが、
  // タグは記事と独立したエンティティであり、孤立しても問題ない設計としている。
  let resolvedTags: Tag[] | undefined
  if (input.tags !== undefined) {
    const resolveResult = await resolveTags(input.tags, {
      tagRepository: deps.tagRepository,
      generateTagId: deps.generateTagId,
    })
    if (!resolveResult.ok) {
      return { status: 'validation_error', message: resolveResult.message }
    }
    resolvedTags = resolveResult.tags
  }

  // --- 書き込みフェーズ ---

  let updated: Article = article
  const now = deps.now()
  const hasContentChange =
    validatedTitle !== undefined || input.body !== undefined

  if (validatedTitle !== undefined) {
    updated = updateArticleContent(updated, { title: validatedTitle }, now)
  }

  if (input.body !== undefined) {
    // immutableなkeyに新しい本文を保存する。
    // D1保存前にR2保存が失敗しても旧keyが有効なまま。
    // D1保存が失敗しても旧keyはそのままで整合性が保たれる（新keyは孤立するが許容）。
    const newBodyKey = deps.generateBodyKey()
    await deps.bodyStorage.save(newBodyKey, input.body)
    updated = { ...updated, bodyKey: newBodyKey, updatedAt: now }
  }

  // タイトルか本文の変更がある場合、記事を保存する
  if (hasContentChange) {
    if (input.body !== undefined) {
      // 本文変更あり: bodyKey（と必要ならtitle）のみ narrow UPDATE
      // status/publishedAt/scheduledAt を含まず並行更新（公開・予約等）を上書きしない
      await deps.repository.updateBodyKey(
        updated.id,
        updated.bodyKey,
        validatedTitle,
        now,
      )
      // D1保存成功後、旧bodyKeyをR2から削除する（best-effort）
      // 失敗した場合はクリーンアップキューに登録してcronが再試行する
      await deps.bodyStorage.delete(article.bodyKey).catch(async (e) => {
        console.error(`旧bodyKey削除失敗: bodyKey=${article.bodyKey}`, e)
        await deps.bodyKeyDeletionQueue
          .enqueue(article.bodyKey, deps.now())
          .catch((queueErr) => {
            console.error(
              `クリーンアップキューへの追加も失敗: bodyKey=${article.bodyKey}`,
              queueErr,
            )
          })
      })
    } else {
      // タイトルのみ変更: bodyKey を上書きしない narrow UPDATE
      await deps.repository.updateTitle(updated.id, updated.title, now)
    }
  }

  // タグの更新
  if (resolvedTags !== undefined) {
    await deps.tagRepository.setArticleTags(
      updated.id,
      resolvedTags.map((t) => t.id),
    )
    // タグのみ更新の場合も updatedAt を更新する（narrow UPDATE で bodyKey を触らない）
    if (!hasContentChange) {
      updated = { ...updated, updatedAt: now }
      await deps.repository.updateUpdatedAt(updated.id, now)
    }
  }

  // 最新のタグと本文を取得して返す
  const tags = await deps.tagRepository.findByArticleId(updated.id)
  const bodyResult = await deps.bodyStorage.get(updated.bodyKey)
  if (!bodyResult.found) return { status: 'body_not_found' }

  return { status: 'updated', article: updated, body: bodyResult.content, tags }
}
