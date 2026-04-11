import { HttpResponse, http } from 'msw'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function toStringArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((item): item is string => typeof item === 'string')
    : []
}

type MockArticle = {
  publicId: string
  title: string
  body: string
  status: 'draft' | 'published' | 'scheduled'
  tags: string[]
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  scheduledAt: string | null
}

type MockComment = {
  id: string
  articleId: string
  authorName: string
  content: string
  createdAt: string
}

const mockComments: MockComment[] = [
  {
    id: 'comment-1',
    articleId: 'abc123',
    authorName: '読者A',
    content: 'とても参考になりました。',
    createdAt: '2026-03-02T10:00:00.000Z',
  },
]

/** モック用の記事データ（APIレスポンスのDTO構造に準拠） */
const mockArticles: MockArticle[] = [
  {
    publicId: 'abc123',
    title: 'はじめてのブログ記事',
    body: '# はじめてのブログ記事\n\nこれはモック記事の本文です。',
    status: 'published',
    tags: [],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
    publishedAt: '2026-03-01T12:00:00.000Z',
    scheduledAt: null,
  },
  {
    publicId: 'def456',
    title: '下書きの記事',
    body: '# 下書きの記事\n\nこれはモック記事の本文です。',
    status: 'draft',
    tags: [],
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
    publishedAt: null,
    scheduledAt: null,
  },
  {
    publicId: 'ghi789',
    title: 'Markdownで書く技術記事',
    body: '# Markdownで書く技術記事\n\nこれはモック記事の本文です。',
    status: 'draft',
    tags: [],
    createdAt: '2026-03-03T10:00:00.000Z',
    updatedAt: '2026-03-03T10:00:00.000Z',
    publishedAt: null,
    scheduledAt: null,
  },
]

function paginate(articles: MockArticle[], page: number, limit: number) {
  const start = (page - 1) * limit
  const items = articles.slice(start, start + limit)
  return {
    items,
    totalCount: articles.length,
    page,
    limit,
    totalPages: Math.ceil(articles.length / limit),
  }
}

function parsePageParams(url: URL) {
  const rawPage = Number(url.searchParams.get('page') ?? '1')
  const rawLimit = Number(url.searchParams.get('limit') ?? '20')
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1
  const limit =
    Number.isInteger(rawLimit) && rawLimit >= 1 && rawLimit <= 100
      ? rawLimit
      : 20
  const tagsParam = url.searchParams.get('tags')
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : []
  return { page, limit, tags }
}

/** レスポンスから body を除外する（一覧用） */
function omitBody({ body: _, ...rest }: MockArticle) {
  return rest
}

const MOCK_ADMIN_USERNAME = 'admin'
const MOCK_ADMIN_PASSWORD = 'password'
const MOCK_TOKEN = 'mock-jwt-token'

export const handlers = [
  http.get(`${baseUrl}/api/hello`, () => {
    return HttpResponse.json({ message: 'Hello from MSW!' })
  }),

  /** ログイン */
  http.post(`${baseUrl}/api/auth/login`, async ({ request }) => {
    const parsed: unknown = await request.json()
    if (
      !isRecord(parsed) ||
      parsed.username !== MOCK_ADMIN_USERNAME ||
      parsed.password !== MOCK_ADMIN_PASSWORD
    ) {
      return HttpResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 },
      )
    }
    return HttpResponse.json({ token: MOCK_TOKEN })
  }),

  /** 認証状態の確認 */
  http.get(`${baseUrl}/api/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== `Bearer ${MOCK_TOKEN}`) {
      return HttpResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    return HttpResponse.json({ username: MOCK_ADMIN_USERNAME })
  }),

  /** 記事一覧の取得（ページネーション付き） */
  http.get(`${baseUrl}/api/articles`, ({ request }) => {
    const url = new URL(request.url)
    const { page, limit, tags } = parsePageParams(url)
    const filtered =
      tags.length > 0
        ? mockArticles.filter((a) => tags.some((t) => a.tags.includes(t)))
        : mockArticles
    const result = paginate(filtered, page, limit)
    return HttpResponse.json({
      ...result,
      items: result.items.map(omitBody),
    })
  }),

  /** 記事の作成 */
  http.post(`${baseUrl}/api/articles`, async ({ request }) => {
    const parsed: unknown = await request.json()
    if (
      !isRecord(parsed) ||
      typeof parsed.title !== 'string' ||
      typeof parsed.body !== 'string'
    ) {
      return HttpResponse.json(
        { message: 'title と body は必須です' },
        { status: 400 },
      )
    }
    const now = new Date().toISOString()
    const publish = parsed.publish === true
    const newArticle: MockArticle = {
      publicId: `mock-${Date.now()}`,
      title: parsed.title,
      body: parsed.body,
      status: publish ? 'published' : 'draft',
      tags: toStringArray(parsed.tags),
      createdAt: now,
      updatedAt: now,
      publishedAt: publish ? now : null,
      scheduledAt: null,
    }
    mockArticles.push(newArticle)
    return HttpResponse.json(omitBody(newArticle), { status: 201 })
  }),

  /** 単一記事の取得 */
  http.get(`${baseUrl}/api/articles/:publicId`, ({ params }) => {
    const article = mockArticles.find((a) => a.publicId === params.publicId)
    if (!article) {
      return HttpResponse.json(
        { message: '記事が見つかりません' },
        { status: 404 },
      )
    }
    return HttpResponse.json(article)
  }),

  /** 記事の更新 */
  http.patch(
    `${baseUrl}/api/articles/:publicId`,
    async ({ params, request }) => {
      const article = mockArticles.find((a) => a.publicId === params.publicId)
      if (!article) {
        return HttpResponse.json(
          { message: '記事が見つかりません' },
          { status: 404 },
        )
      }
      const parsed: unknown = await request.json()
      if (!isRecord(parsed)) {
        return HttpResponse.json(
          { message: '不正なリクエストです' },
          { status: 400 },
        )
      }
      if (typeof parsed.title === 'string') article.title = parsed.title
      if (typeof parsed.body === 'string') article.body = parsed.body
      if (Array.isArray(parsed.tags)) article.tags = toStringArray(parsed.tags)
      article.updatedAt = new Date().toISOString()
      return HttpResponse.json(article)
    },
  ),

  /** 記事の公開 */
  http.patch(`${baseUrl}/api/articles/:publicId/publish`, ({ params }) => {
    const article = mockArticles.find((a) => a.publicId === params.publicId)
    if (!article) {
      return HttpResponse.json(
        { message: '記事が見つかりません' },
        { status: 404 },
      )
    }
    if (article.status === 'published') {
      return HttpResponse.json(
        { message: 'この記事は既に公開されています' },
        { status: 400 },
      )
    }
    const now = new Date().toISOString()
    article.status = 'published'
    article.updatedAt = now
    article.publishedAt = now
    article.scheduledAt = null
    return HttpResponse.json(omitBody(article))
  }),

  /** 記事の予約公開 */
  http.patch(
    `${baseUrl}/api/articles/:publicId/schedule`,
    async ({ params, request }) => {
      const article = mockArticles.find((a) => a.publicId === params.publicId)
      if (!article) {
        return HttpResponse.json(
          { message: '記事が見つかりません' },
          { status: 404 },
        )
      }
      const parsed: unknown = await request.json()
      article.status = 'scheduled'
      article.updatedAt = new Date().toISOString()
      article.scheduledAt =
        isRecord(parsed) && typeof parsed.scheduledAt === 'string'
          ? parsed.scheduledAt
          : null
      return HttpResponse.json(omitBody(article))
    },
  ),

  /** 記事の予約取消 */
  http.patch(
    `${baseUrl}/api/articles/:publicId/cancel-schedule`,
    ({ params }) => {
      const article = mockArticles.find((a) => a.publicId === params.publicId)
      if (!article) {
        return HttpResponse.json(
          { message: '記事が見つかりません' },
          { status: 404 },
        )
      }
      article.status = 'draft'
      article.updatedAt = new Date().toISOString()
      article.scheduledAt = null
      return HttpResponse.json(omitBody(article))
    },
  ),

  /** 記事の削除 */
  http.delete(`${baseUrl}/api/articles/:publicId`, ({ params }) => {
    const idx = mockArticles.findIndex((a) => a.publicId === params.publicId)
    if (idx === -1) {
      return HttpResponse.json(
        { message: '記事が見つかりません' },
        { status: 404 },
      )
    }
    mockArticles.splice(idx, 1)
    return HttpResponse.json({ message: '削除しました' })
  }),

  /** タグの更新 */
  http.patch(
    `${baseUrl}/api/articles/:publicId/tags`,
    async ({ params, request }) => {
      const article = mockArticles.find((a) => a.publicId === params.publicId)
      if (!article) {
        return HttpResponse.json(
          { message: '記事が見つかりません' },
          { status: 404 },
        )
      }
      const parsed: unknown = await request.json()
      if (isRecord(parsed) && Array.isArray(parsed.tags)) {
        article.tags = toStringArray(parsed.tags)
        article.updatedAt = new Date().toISOString()
      }
      return HttpResponse.json({ tags: article.tags })
    },
  ),

  /** 公開記事一覧 */
  http.get(`${baseUrl}/api/public/articles`, ({ request }) => {
    const url = new URL(request.url)
    const { page, limit, tags } = parsePageParams(url)
    const published = mockArticles.filter((a) => a.status === 'published')
    const filtered =
      tags.length > 0
        ? published.filter((a) => tags.some((t) => a.tags.includes(t)))
        : published
    const result = paginate(filtered, page, limit)
    return HttpResponse.json({
      ...result,
      items: result.items.map(omitBody),
    })
  }),

  /** 公開記事詳細 */
  http.get(`${baseUrl}/api/public/articles/:publicId`, ({ params }) => {
    const article = mockArticles.find(
      (a) => a.publicId === params.publicId && a.status === 'published',
    )
    if (!article) {
      return HttpResponse.json(
        { message: '記事が見つかりません' },
        { status: 404 },
      )
    }
    return HttpResponse.json(article)
  }),

  /** コメント一覧取得 */
  http.get(
    `${baseUrl}/api/public/articles/:publicId/comments`,
    ({ params }) => {
      const article = mockArticles.find(
        (a) => a.publicId === params.publicId && a.status === 'published',
      )
      if (!article) {
        return HttpResponse.json(
          { error: '記事が見つかりません' },
          { status: 404 },
        )
      }
      const comments = mockComments.filter(
        (c) => c.articleId === article.publicId,
      )
      return HttpResponse.json({ comments })
    },
  ),

  /** コメント投稿 */
  http.post(
    `${baseUrl}/api/public/articles/:publicId/comments`,
    async ({ params, request }) => {
      const article = mockArticles.find(
        (a) => a.publicId === params.publicId && a.status === 'published',
      )
      if (!article) {
        return HttpResponse.json(
          { error: '記事が見つかりません' },
          { status: 404 },
        )
      }
      const parsed: unknown = await request.json()
      if (
        !isRecord(parsed) ||
        typeof parsed.authorName !== 'string' ||
        typeof parsed.content !== 'string'
      ) {
        return HttpResponse.json(
          { error: 'authorName と content は必須です' },
          { status: 400 },
        )
      }
      const newComment: MockComment = {
        id: `comment-${Date.now()}`,
        articleId: article.publicId,
        authorName: parsed.authorName,
        content: parsed.content,
        createdAt: new Date().toISOString(),
      }
      mockComments.push(newComment)
      return HttpResponse.json(newComment, { status: 201 })
    },
  ),

  /** コメント削除（管理者） */
  http.delete(`${baseUrl}/api/comments/:id`, ({ params }) => {
    const idx = mockComments.findIndex((c) => c.id === params.id)
    if (idx === -1) {
      return HttpResponse.json(
        { error: 'コメントが見つかりません' },
        { status: 404 },
      )
    }
    mockComments.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
