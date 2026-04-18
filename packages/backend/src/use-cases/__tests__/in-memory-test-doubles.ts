import {
  type Article,
  ArticleId,
  BodyKey,
  PublicArticleId,
  type PublishedArticle,
  type Title,
} from '../../domain/models/article'
import type { Comment, CommentId } from '../../domain/models/comment'
import type { Tag, TagName } from '../../domain/models/tag'
import { TagId } from '../../domain/models/tag'
import type {
  ArticleRepository,
  PaginatedResult,
  PaginationParams,
} from '../../domain/ports/article-repository'
import type { BodyKeyDeletionQueue } from '../../domain/ports/body-key-deletion-queue'
import type {
  BodyGetResult,
  BodyStorage,
} from '../../domain/ports/body-storage'
import type { CommentRepository } from '../../domain/ports/comment-repository'
import type { ArticleIdGenerator } from '../../domain/ports/id-generator'
import type { TagRepository } from '../../domain/ports/tag-repository'

export class InMemoryArticleRepository implements ArticleRepository {
  private articles = new Map<string, Article>()
  private shouldFailOnSave = false
  private _pendingBodyKeys = new Set<string>()

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

  async updateUpdatedAt(id: ArticleId, updatedAt: string): Promise<void> {
    const article = this.articles.get(id)
    if (article) {
      this.articles.set(id, { ...article, updatedAt })
    }
  }

  async updateTitle(
    id: ArticleId,
    title: Title,
    updatedAt: string,
  ): Promise<void> {
    const article = this.articles.get(id)
    if (article) {
      this.articles.set(id, { ...article, title, updatedAt })
    }
  }

  async updateBodyKey(
    id: ArticleId,
    bodyKey: BodyKey,
    title: Title | undefined,
    updatedAt: string,
  ): Promise<void> {
    const article = this.articles.get(id)
    if (article) {
      this.articles.set(id, {
        ...article,
        bodyKey,
        ...(title !== undefined ? { title } : {}),
        updatedAt,
      })
    }
  }

  async updateBodyKeyAndEnqueueOldKey(
    id: ArticleId,
    newBodyKey: BodyKey,
    oldBodyKey: BodyKey,
    title: Title | undefined,
    _queuedAt: string,
    updatedAt: string,
  ): Promise<'updated' | 'conflict' | 'not_found'> {
    const article = this.articles.get(id)
    if (!article) return 'not_found'
    if (article.bodyKey !== oldBodyKey) return 'conflict'
    // 原子的に: bodyKey更新 + 旧keyをoutboxに記録
    this._pendingBodyKeys.add(oldBodyKey)
    this.articles.set(id, {
      ...article,
      bodyKey: newBodyKey,
      ...(title !== undefined ? { title } : {}),
      updatedAt,
    })
    return 'updated'
  }

  async updateStatus(
    id: ArticleId,
    status: 'draft' | 'scheduled' | 'published',
    publishedAt: string | null,
    scheduledAt: string | null,
    updatedAt: string,
  ): Promise<void> {
    const article = this.articles.get(id)
    if (!article) return
    const base = {
      id: article.id,
      publicId: article.publicId,
      title: article.title,
      bodyKey: article.bodyKey,
      createdAt: article.createdAt,
      updatedAt,
    }
    if (status === 'draft') {
      this.articles.set(id, {
        ...base,
        status: 'draft',
        publishedAt: null,
        scheduledAt: null,
      })
    } else if (status === 'scheduled') {
      this.articles.set(id, {
        ...base,
        status: 'scheduled',
        publishedAt: null,
        scheduledAt: scheduledAt as string,
      })
    } else {
      this.articles.set(id, {
        ...base,
        status: 'published',
        publishedAt: publishedAt as string,
        scheduledAt,
      })
    }
  }

  async deleteAndEnqueueBodyKey(
    id: ArticleId,
    _queuedAt: string,
  ): Promise<void> {
    // 呼び出し元の stale な bodyKey を使わず、削除時点の現在の bodyKey を outbox に記録する
    const article = this.articles.get(id)
    if (article) {
      this._pendingBodyKeys.add(article.bodyKey)
      this.articles.delete(id)
    }
  }

  hasPendingBodyKey(bodyKey: BodyKey): boolean {
    return this._pendingBodyKeys.has(bodyKey)
  }

  async delete(id: ArticleId): Promise<void> {
    this.articles.delete(id)
  }

  async findAll(): Promise<Article[]> {
    return [...this.articles.values()]
  }

  async findAllPaginated(
    params: PaginationParams,
  ): Promise<PaginatedResult<Article>> {
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

  async findPublishedPaginated(
    params: PaginationParams,
  ): Promise<PaginatedResult<PublishedArticle>> {
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

  async findByArticleIds(articleIds: ArticleId[]): Promise<Map<string, Tag[]>> {
    const result = new Map<string, Tag[]>()
    for (const articleId of articleIds) {
      result.set(articleId, await this.findByArticleId(articleId))
    }
    return result
  }

  async setArticleTags(
    articleId: ArticleId,
    tagIds: Tag['id'][],
  ): Promise<void> {
    this.articleTags.set(articleId, tagIds)
  }
}

export class InMemoryCommentRepository implements CommentRepository {
  private comments = new Map<string, Comment>()

  async save(comment: Comment): Promise<void> {
    this.comments.set(comment.id, comment)
  }

  async findByArticleId(articleId: ArticleId): Promise<Comment[]> {
    return [...this.comments.values()]
      .filter((c) => c.articleId === articleId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  async findById(id: CommentId): Promise<Comment | null> {
    return this.comments.get(id) ?? null
  }

  async deleteById(id: CommentId): Promise<boolean> {
    const existed = this.comments.has(id)
    this.comments.delete(id)
    return existed
  }

  getAll(): Comment[] {
    return [...this.comments.values()]
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

export class InMemoryBodyKeyDeletionQueue implements BodyKeyDeletionQueue {
  private queue = new Map<string, string>()

  async enqueue(bodyKey: BodyKey, queuedAt: string): Promise<void> {
    this.queue.set(bodyKey, queuedAt)
  }

  async listBatch(limit: number): Promise<BodyKey[]> {
    return [...this.queue.entries()]
      .sort(([, a], [, b]) => a.localeCompare(b))
      .slice(0, limit)
      .map(([key]) => BodyKey(key))
  }

  async remove(bodyKey: BodyKey): Promise<void> {
    this.queue.delete(bodyKey)
  }

  has(bodyKey: BodyKey): boolean {
    return this.queue.has(bodyKey)
  }
}
