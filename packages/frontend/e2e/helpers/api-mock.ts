import type { Page } from '@playwright/test'

const API_BASE = 'http://localhost:8787'

export type MockArticle = {
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

/** テスト用の記事データを生成する */
export function createMockArticles(): MockArticle[] {
  return [
    {
      publicId: 'pub-001',
      title: 'はじめてのブログ記事',
      body: '# はじめてのブログ記事\n\nこれは最初の記事です。\n\nブログを始めました。',
      status: 'published',
      tags: ['日記', 'はじめまして'],
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T12:00:00.000Z',
      publishedAt: '2026-03-01T12:00:00.000Z',
      scheduledAt: null,
    },
    {
      publicId: 'pub-002',
      title: 'TypeScriptの型システム入門',
      body: '# TypeScriptの型システム入門\n\nTypeScriptの型システムについて解説します。',
      status: 'published',
      tags: ['技術', 'TypeScript'],
      createdAt: '2026-03-05T00:00:00.000Z',
      updatedAt: '2026-03-05T10:00:00.000Z',
      publishedAt: '2026-03-05T10:00:00.000Z',
      scheduledAt: null,
    },
    {
      publicId: 'draft-001',
      title: '下書きの記事',
      body: '# 下書きの記事\n\nまだ公開していない記事です。',
      status: 'draft',
      tags: [],
      createdAt: '2026-03-10T00:00:00.000Z',
      updatedAt: '2026-03-10T00:00:00.000Z',
      publishedAt: null,
      scheduledAt: null,
    },
    {
      publicId: 'draft-002',
      title: 'Reactのパフォーマンス最適化',
      body: '# Reactのパフォーマンス最適化\n\nメモ化やコード分割について。',
      status: 'draft',
      tags: ['技術', 'React'],
      createdAt: '2026-03-12T00:00:00.000Z',
      updatedAt: '2026-03-12T00:00:00.000Z',
      publishedAt: null,
      scheduledAt: null,
    },
    {
      publicId: 'sched-001',
      title: '予約公開テスト記事',
      body: '# 予約公開テスト記事\n\n予約公開用の記事です。',
      status: 'scheduled',
      tags: ['テスト'],
      createdAt: '2026-03-15T00:00:00.000Z',
      updatedAt: '2026-03-15T00:00:00.000Z',
      publishedAt: null,
      scheduledAt: '2026-04-01T09:00:00.000Z',
    },
  ]
}

type PaginatedResponse<T> = {
  items: T[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

function paginate<T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const start = (page - 1) * limit
  return {
    items: items.slice(start, start + limit),
    totalCount: items.length,
    page,
    limit,
    totalPages: Math.ceil(items.length / limit),
  }
}

/** Playwright の page.route を使った API モックをセットアップする */
export async function setupApiMock(
  page: Page,
  initialArticles?: MockArticle[],
) {
  const articles = initialArticles ?? createMockArticles()

  // --- 管理者用 API ---

  /** 記事一覧の取得 */
  await page.route(`${API_BASE}/api/articles?*`, async (route) => {
    const url = new URL(route.request().url())
    const pageNum = Number(url.searchParams.get('page') ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '20')
    const result = paginate(articles, pageNum, limit)
    // body を除外してレスポンス
    const items = result.items.map(({ body: _, ...rest }) => rest)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...result, items }),
    })
  })

  /** 記事一覧（クエリなし） */
  await page.route(`${API_BASE}/api/articles`, async (route, request) => {
    if (request.method() === 'GET') {
      const result = paginate(articles, 1, 20)
      const items = result.items.map(({ body: _, ...rest }) => rest)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...result, items }),
      })
    } else if (request.method() === 'POST') {
      const reqBody = request.postDataJSON()
      const now = new Date().toISOString()
      const newArticle: MockArticle = {
        publicId: `new-${Date.now()}`,
        title: reqBody.title,
        body: reqBody.body,
        status: reqBody.publish ? 'published' : 'draft',
        tags: reqBody.tags ?? [],
        createdAt: now,
        updatedAt: now,
        publishedAt: reqBody.publish ? now : null,
        scheduledAt: null,
      }
      articles.unshift(newArticle)
      const { body: _, ...rest } = newArticle
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(rest),
      })
    } else {
      await route.continue()
    }
  })

  /** 記事の公開 */
  await page.route(
    `${API_BASE}/api/articles/*/publish`,
    async (route, request) => {
      if (request.method() !== 'PATCH') {
        await route.continue()
        return
      }
      const url = new URL(request.url())
      const publicId = url.pathname.split('/')[3]
      const article = articles.find((a) => a.publicId === publicId)
      if (!article) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: '記事が見つかりません' }),
        })
        return
      }
      const now = new Date().toISOString()
      article.status = 'published'
      article.updatedAt = now
      article.publishedAt = now
      article.scheduledAt = null
      const { body: _, ...rest } = article
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(rest),
      })
    },
  )

  /** 記事の予約公開 */
  await page.route(
    `${API_BASE}/api/articles/*/schedule`,
    async (route, request) => {
      if (request.method() !== 'PATCH') {
        await route.continue()
        return
      }
      const url = new URL(request.url())
      const publicId = url.pathname.split('/')[3]
      const article = articles.find((a) => a.publicId === publicId)
      if (!article) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: '記事が見つかりません' }),
        })
        return
      }
      const reqBody = request.postDataJSON()
      article.status = 'scheduled'
      article.updatedAt = new Date().toISOString()
      article.scheduledAt = reqBody.scheduledAt
      const { body: _, ...rest } = article
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(rest),
      })
    },
  )

  /** 記事の予約取消 */
  await page.route(
    `${API_BASE}/api/articles/*/cancel-schedule`,
    async (route, request) => {
      if (request.method() !== 'PATCH') {
        await route.continue()
        return
      }
      const url = new URL(request.url())
      const publicId = url.pathname.split('/')[3]
      const article = articles.find((a) => a.publicId === publicId)
      if (!article) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: '記事が見つかりません' }),
        })
        return
      }
      article.status = 'draft'
      article.updatedAt = new Date().toISOString()
      article.scheduledAt = null
      const { body: _, ...rest } = article
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(rest),
      })
    },
  )

  /** 記事のタグ更新 */
  await page.route(
    `${API_BASE}/api/articles/*/tags`,
    async (route, request) => {
      if (request.method() !== 'PATCH') {
        await route.continue()
        return
      }
      const url = new URL(request.url())
      const publicId = url.pathname.split('/')[3]
      const article = articles.find((a) => a.publicId === publicId)
      if (!article) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: '記事が見つかりません' }),
        })
        return
      }
      const reqBody = request.postDataJSON()
      article.tags = reqBody.tags
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tags: article.tags }),
      })
    },
  )

  /** 単一記事の取得・更新・削除 */
  await page.route(
    new RegExp(`${API_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/api/articles/[^/]+$`),
    async (route, request) => {
      const method = request.method()
      const url = new URL(request.url())
      const publicId = url.pathname.split('/')[3]

      if (method === 'GET') {
        const article = articles.find((a) => a.publicId === publicId)
        if (!article) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ message: '記事が見つかりません' }),
          })
          return
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(article),
        })
      } else if (method === 'PATCH') {
        const article = articles.find((a) => a.publicId === publicId)
        if (!article) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ message: '記事が見つかりません' }),
          })
          return
        }
        const reqBody = request.postDataJSON()
        if (reqBody.title !== undefined) article.title = reqBody.title
        if (reqBody.body !== undefined) article.body = reqBody.body
        if (reqBody.tags !== undefined) article.tags = reqBody.tags
        article.updatedAt = new Date().toISOString()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(article),
        })
      } else if (method === 'DELETE') {
        const idx = articles.findIndex((a) => a.publicId === publicId)
        if (idx === -1) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ message: '記事が見つかりません' }),
          })
          return
        }
        articles.splice(idx, 1)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: '削除しました' }),
        })
      } else {
        await route.continue()
      }
    },
  )

  // --- 公開読者用 API ---

  /** 公開記事一覧 */
  await page.route(`${API_BASE}/api/public/articles?*`, async (route) => {
    const url = new URL(route.request().url())
    const pageNum = Number(url.searchParams.get('page') ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '20')
    const published = articles.filter((a) => a.status === 'published')
    const result = paginate(published, pageNum, limit)
    const items = result.items.map(({ body: _, ...rest }) => rest)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...result, items }),
    })
  })

  /** 公開記事一覧（クエリなし） */
  await page.route(`${API_BASE}/api/public/articles`, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }
    const published = articles.filter((a) => a.status === 'published')
    const result = paginate(published, 1, 20)
    const items = result.items.map(({ body: _, ...rest }) => rest)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...result, items }),
    })
  })

  /** 公開記事詳細 */
  await page.route(
    new RegExp(`${API_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/api/public/articles/[^/]+$`),
    async (route) => {
      const url = new URL(route.request().url())
      const publicId = url.pathname.split('/')[4]
      const article = articles.find(
        (a) => a.publicId === publicId && a.status === 'published',
      )
      if (!article) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: '記事が見つかりません' }),
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(article),
      })
    },
  )

  return articles
}
