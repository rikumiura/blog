import {
  createDraftArticle,
  createTitle,
  type DraftArticle,
} from '../domain/models/article'
import type { Tag } from '../domain/models/tag'
import type { ArticleRepository } from '../domain/ports/article-repository'
import type { BodyStorage } from '../domain/ports/body-storage'
import type { ArticleIdGenerator } from '../domain/ports/id-generator'
import type { TagRepository } from '../domain/ports/tag-repository'
import { resolveTags } from './resolve-tags'

export type CreateArticleResult =
  | { status: 'created'; article: DraftArticle; tags: Tag[] }
  | { status: 'validation_error'; message: string }

export async function createArticle(
  input: { title: string; body: string; tags?: string[] },
  deps: {
    repository: ArticleRepository
    bodyStorage: BodyStorage
    idGenerator: ArticleIdGenerator
    tagRepository: TagRepository
    now: () => string
  },
): Promise<CreateArticleResult> {
  const titleResult = createTitle(input.title)
  if (!titleResult.ok) {
    return { status: 'validation_error', message: titleResult.message }
  }
  const title = titleResult.value
  const id = deps.idGenerator.generateArticleId()
  const publicId = deps.idGenerator.generatePublicArticleId()
  const bodyKey = deps.idGenerator.generateBodyKey()

  // タグの解決（バリデーション + upsert）
  const tagNames = input.tags ?? []
  const resolveResult = await resolveTags(tagNames, {
    tagRepository: deps.tagRepository,
    generateTagId: () => deps.idGenerator.generateTagId(),
  })
  if (!resolveResult.ok) {
    return { status: 'validation_error', message: resolveResult.message }
  }

  await deps.bodyStorage.save(bodyKey, input.body)

  const now = deps.now()
  const article = createDraftArticle({ id, publicId, title, bodyKey, now })
  try {
    await deps.repository.save(article)
    // 記事とタグの紐付け
    if (resolveResult.tags.length > 0) {
      await deps.tagRepository.setArticleTags(
        article.id,
        resolveResult.tags.map((t) => t.id),
      )
    }
  } catch (error) {
    // DB保存失敗時にR2の孤立ファイルを削除する補償処理
    await deps.bodyStorage.delete(bodyKey).catch(() => {
      console.error(`補償処理失敗: R2ファイル ${bodyKey} の削除に失敗しました`)
    })
    throw error
  }

  return { status: 'created', article, tags: resolveResult.tags }
}
