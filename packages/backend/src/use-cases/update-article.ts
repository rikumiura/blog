import {
  type Article,
  type PublicArticleId,
  type Title,
  createTitle,
  updateArticleContent,
} from '../domain/models/article'
import type { Tag } from '../domain/models/tag'
import type { ArticleRepository } from '../domain/ports/article-repository'
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
    generateTagId: () => Tag['id']
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
  const hasContentChange = validatedTitle !== undefined || input.body !== undefined

  if (validatedTitle !== undefined) {
    updated = updateArticleContent(updated, { title: validatedTitle }, now)
  }

  if (input.body !== undefined) {
    await deps.bodyStorage.save(article.bodyKey, input.body)
  }

  // タイトルか本文の変更がある場合、記事を保存する
  if (hasContentChange) {
    if (validatedTitle === undefined) {
      // 本文のみ変更の場合、updatedAt だけ更新
      updated = { ...updated, updatedAt: now }
    }
    await deps.repository.save(updated)
  }

  // タグの更新
  if (resolvedTags !== undefined) {
    await deps.tagRepository.setArticleTags(
      updated.id,
      resolvedTags.map((t) => t.id),
    )
    // タグのみ更新の場合も updatedAt を更新する
    if (!hasContentChange) {
      updated = { ...updated, updatedAt: now }
      await deps.repository.save(updated)
    }
  }

  // 最新のタグと本文を取得して返す
  const tags = await deps.tagRepository.findByArticleId(updated.id)
  const bodyResult = await deps.bodyStorage.get(updated.bodyKey)
  if (!bodyResult.found) return { status: 'body_not_found' }

  return { status: 'updated', article: updated, body: bodyResult.content, tags }
}
