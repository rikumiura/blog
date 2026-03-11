import type { PublicArticleId } from '../domain/models/article'
import type { Tag } from '../domain/models/tag'
import type { ArticleRepository } from '../domain/ports/article-repository'
import type { TagRepository } from '../domain/ports/tag-repository'
import { type ResolveTagsResult, resolveTags } from './resolve-tags'

export type UpdateArticleTagsResult =
  | { status: 'updated'; tags: Tag[] }
  | { status: 'not_found' }
  | { status: 'validation_error'; message: string }

export async function updateArticleTags(
  publicId: PublicArticleId,
  tagNames: string[],
  deps: {
    articleRepository: ArticleRepository
    tagRepository: TagRepository
    generateTagId: () => Tag['id']
  },
): Promise<UpdateArticleTagsResult> {
  const article = await deps.articleRepository.findByPublicId(publicId)
  if (!article) return { status: 'not_found' }

  const resolveResult: ResolveTagsResult = await resolveTags(tagNames, {
    tagRepository: deps.tagRepository,
    generateTagId: deps.generateTagId,
  })

  if (!resolveResult.ok) {
    return { status: 'validation_error', message: resolveResult.message }
  }

  const resolvedTags = resolveResult.tags
  await deps.tagRepository.setArticleTags(
    article.id,
    resolvedTags.map((t) => t.id),
  )

  return { status: 'updated', tags: resolvedTags }
}
