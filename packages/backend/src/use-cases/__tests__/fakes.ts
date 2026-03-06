import type {
  Article,
  ArticleId,
  BodyKey,
  PublicArticleId,
} from '../../domain/models/article'
import type { ArticleRepository } from '../../domain/ports/article-repository'
import type { BodyStorage } from '../../domain/ports/body-storage'
import type { ArticleIdGenerator } from '../../domain/ports/id-generator'

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

  async findAll(): Promise<Article[]> {
    return [...this.articles.values()]
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

  async get(key: BodyKey): Promise<string | null> {
    return this.bodies.get(key) ?? null
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
    return this._articleId as ArticleId
  }

  generatePublicArticleId(): PublicArticleId {
    return this._publicArticleId as PublicArticleId
  }

  generateBodyKey(): BodyKey {
    return this._bodyKey as BodyKey
  }
}
