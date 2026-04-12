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
  | { status: 'conflict' }

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
      // 本文変更あり: bodyKey更新と旧key outbox登録を D1 batch で原子的に実行
      // CAS（旧bodyKeyをWHERE条件に含む）で並行更新を検出する
      let casResult: 'updated' | 'conflict' | 'not_found'
      try {
        casResult = await deps.repository.updateBodyKeyAndEnqueueOldKey(
          updated.id,
          updated.bodyKey, // 新 bodyKey
          article.bodyKey, // 旧 bodyKey（CAS条件 + outbox登録対象）
          validatedTitle,
          now,
          now,
        )
      } catch (e) {
        // D1 batch 失敗: 新 bodyKey が R2 に保存済みだが DB に反映されていない
        // R2 から直接削除を試みてクリーンアップし、失敗なら outbox へ記録する
        console.error(`D1 bodyKey 更新失敗: bodyKey=${updated.bodyKey}`, e)
        await deps.bodyStorage
          .delete(updated.bodyKey)
          .catch(async (deleteErr) => {
            console.error(
              `孤立した新bodyKey R2削除失敗: bodyKey=${updated.bodyKey}`,
              deleteErr,
            )
            await deps.bodyKeyDeletionQueue
              .enqueue(updated.bodyKey, now)
              .catch((queueErr) => {
                console.error(
                  `孤立した新bodyKeyのキュー登録も失敗: bodyKey=${updated.bodyKey}`,
                  queueErr,
                )
              })
          })
        throw e // D1障害は想定外エラーなので上位へ伝播させる
      }
      if (casResult !== 'updated') {
        // CAS競合 or 記事不在: 新 bodyKey は孤立している
        // R2 から直接削除を試みて同期的にクリーンアップし、失敗なら outbox へ
        await deps.bodyStorage
          .delete(updated.bodyKey)
          .catch(async (deleteErr) => {
            console.error(
              `競合時の新bodyKey R2削除失敗: bodyKey=${updated.bodyKey}`,
              deleteErr,
            )
            await deps.bodyKeyDeletionQueue
              .enqueue(updated.bodyKey, now)
              .catch((queueErr) => {
                console.error(
                  `競合時の新bodyKeyのキュー登録も失敗: bodyKey=${updated.bodyKey}`,
                  queueErr,
                )
              })
          })
        return casResult === 'not_found'
          ? { status: 'not_found' }
          : { status: 'conflict' }
      }
      // DB更新成功後、旧bodyKeyをR2から削除する（best-effort）
      // 旧keyはbatchで既にoutboxに登録済みのため、cronが再試行可能
      await deps.bodyStorage.delete(article.bodyKey).catch((e) => {
        console.error(`旧bodyKey R2削除失敗: bodyKey=${article.bodyKey}`, e)
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
