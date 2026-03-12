import {
  type Article,
  type PublicArticleId,
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

  let updated = article

  // タイトル更新
  if (input.title !== undefined) {
    const titleResult = createTitle(input.title)
    if (!titleResult.ok) {
      return { status: 'validation_error', message: titleResult.message }
    }
    updated = updateArticleContent(updated, { title: titleResult.value }, deps.now())
  }

  // 本文更新
  if (input.body !== undefined) {
    await deps.bodyStorage.save(article.bodyKey, input.body)
  }

  // updatedAt を更新（本文のみ変更の場合もタイムスタンプを更新する）
  if (input.title !== undefined || input.body !== undefined) {
    if (input.title === undefined) {
      // 本文のみ変更の場合、updatedAt だけ更新
      updated = { ...updated, updatedAt: deps.now() }
    }
    await deps.repository.save(updated)
  }

  // タグ更新
  if (input.tags !== undefined) {
    const resolveResult = await resolveTags(input.tags, {
      tagRepository: deps.tagRepository,
      generateTagId: deps.generateTagId,
    })
    if (!resolveResult.ok) {
      return { status: 'validation_error', message: resolveResult.message }
    }
    await deps.tagRepository.setArticleTags(
      updated.id,
      resolveResult.tags.map((t) => t.id),
    )
  }

  // 最新のタグと本文を取得して返す
  const tags = await deps.tagRepository.findByArticleId(updated.id)
  const bodyResult = await deps.bodyStorage.get(updated.bodyKey)
  const body = bodyResult.found ? bodyResult.content : ''

  return { status: 'updated', article: updated, body, tags }
}
