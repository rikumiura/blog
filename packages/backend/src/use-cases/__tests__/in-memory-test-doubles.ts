import {
  type Article,
  ArticleId,
  BodyKey,
  type PublishedArticle,
  PublicArticleId,
} from '../../domain/models/article'
import type { Tag, TagName } from '../../domain/models/tag'
import { TagId } from '../../domain/models/tag'
import type {
  ArticleRepository,
  PaginatedResult,
  PaginationParams,
} from '../../domain/ports/article-repository'
import type { BodyGetResult, BodyStorage } from '../../domain/ports/body-storage'
import type { ArticleIdGenerator } from '../../domain/ports/id-generator'
import type { TagRepository } from '../../domain/ports/tag-repository'

export class InMemoryArticleRepository implements ArticleRepository {
  private articles = new Map<string, Article>()
  private shouldFailOnSave = false

  async save(article: Article): Promise<void> {
    if (this.shouldFailOnSave) {
      throw new Error('リポジトリ保存エラー')
    }
    this.articles.set(article.id, article)
  }

  async findById(id: ArticleId): Promise<Article | null> {
    return this.articles.get(id) ?? null
  }

  async findByPublicId(publicId: PublicArticleId): Promise<Article | null> {
    for (const article of this.articles.values()) {
      if (article.publicId === publicId) return article
    }
    return null
  }

  async delete(id: ArticleId): Promise<void> {
    this.articles.delete(id)
  }

  async findAll(): Promise<Article[]> {
    return [...this.articles.values()]
  }

  async findAllPaginated(params: PaginationParams): Promise<PaginatedResult<Article>> {
    const all = [...this.articles.values()]
    const offset = (params.page - 1) * params.limit
    return {
      items: all.slice(offset, offset + params.limit),
      totalCount: all.length,
    }
  }

  async findPublished(): Promise<PublishedArticle[]> {
    return [...this.articles.values()]
      .filter((a): a is PublishedArticle => a.status === 'published')
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  }

  async findPublishedPaginated(params: PaginationParams): Promise<PaginatedResult<PublishedArticle>> {
    const published = await this.findPublished()
    const offset = (params.page - 1) * params.limit
    return {
      items: published.slice(offset, offset + params.limit),
      totalCount: published.length,
    }
  }

  async findScheduledBefore(before: string): Promise<Article[]> {
    return [...this.articles.values()].filter(
      (a) => a.status === 'scheduled' && a.scheduledAt <= before,
    )
  }

  simulateSaveError(): void {
    this.shouldFailOnSave = true
  }
}

export class InMemoryBodyStorage implements BodyStorage {
  private bodies = new Map<string, string>()
  private shouldFailOnDelete = false

  async save(key: BodyKey, content: string): Promise<void> {
    this.bodies.set(key, content)
  }

  async get(key: BodyKey): Promise<BodyGetResult> {
    const content = this.bodies.get(key)
    if (content === undefined) return { found: false }
    return { found: true, content }
  }

  async delete(key: BodyKey): Promise<void> {
    if (this.shouldFailOnDelete) {
      throw new Error('ストレージ削除エラー')
    }
    this.bodies.delete(key)
  }

  has(key: BodyKey): boolean {
    return this.bodies.has(key)
  }

  simulateDeleteError(): void {
    this.shouldFailOnDelete = true
  }
}

export class InMemoryTagRepository implements TagRepository {
  private tags = new Map<string, Tag>()
  private articleTags = new Map<string, string[]>()

  async findByNames(names: TagName[]): Promise<Tag[]> {
    return [...this.tags.values()].filter((t) =>
      names.some((n) => String(n) === String(t.name)),
    )
  }

  async saveMany(tags: Tag[]): Promise<void> {
    for (const tag of tags) {
      this.tags.set(tag.id, tag)
    }
  }

  async findByArticleId(articleId: ArticleId): Promise<Tag[]> {
    const tagIds = this.articleTags.get(articleId) ?? []
    return tagIds
      .map((id) => this.tags.get(id))
      .filter((t): t is Tag => t !== undefined)
  }

  async findByArticleIds(
    articleIds: ArticleId[],
  ): Promise<Map<string, Tag[]>> {
    const result = new Map<string, Tag[]>()
    for (const articleId of articleIds) {
      result.set(articleId, await this.findByArticleId(articleId))
    }
    return result
  }

  async setArticleTags(articleId: ArticleId, tagIds: Tag['id'][]): Promise<void> {
    this.articleTags.set(articleId, tagIds)
  }
}

export class FakeArticleIdGenerator implements ArticleIdGenerator {
  private _articleId: string
  private _publicArticleId: string
  private _bodyKey: string

  constructor(articleId: string, publicArticleId: string, bodyKey: string) {
    this._articleId = articleId
    this._publicArticleId = publicArticleId
    this._bodyKey = bodyKey
  }

  generateArticleId(): ArticleId {
    return ArticleId(this._articleId)
  }

  generatePublicArticleId(): PublicArticleId {
    return PublicArticleId(this._publicArticleId)
  }

  generateBodyKey(): BodyKey {
    return BodyKey(this._bodyKey)
  }

  private _tagIdCounter = 0
  generateTagId(): TagId {
    this._tagIdCounter++
    return TagId(`tag-${this._tagIdCounter}`)
  }
}
