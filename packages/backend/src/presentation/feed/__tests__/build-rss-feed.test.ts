import { describe, expect, it } from 'vitest'
import { buildRssFeed, type FeedArticle } from '../build-rss-feed'

const siteUrl = 'https://blog.example.com'

const sampleArticles: FeedArticle[] = [
  {
    publicId: 'abc123',
    title: '最初の記事',
    publishedAt: '2026-06-30T12:00:00.000Z',
  },
  {
    publicId: 'def456',
    title: '二番目の記事',
    publishedAt: '2026-06-29T09:30:00.000Z',
  },
]

describe('buildRssFeed', () => {
  it('RSS 2.0 のルート要素と channel メタ情報を含む', () => {
    const xml = buildRssFeed({ siteUrl, articles: sampleArticles })

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<channel>')
    expect(xml).toContain(`<link>${siteUrl}</link>`)
    expect(xml).toContain('<language>ja</language>')
  })

  it('フィード自身を指す atom:link rel="self" を含む', () => {
    const xml = buildRssFeed({ siteUrl, articles: sampleArticles })

    expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"')
    expect(xml).toContain(
      `<atom:link href="${siteUrl}/api/public/feed.xml" rel="self" type="application/rss+xml"/>`,
    )
  })

  it('各記事を item として含め、link が記事ページの絶対 URL になる', () => {
    const xml = buildRssFeed({ siteUrl, articles: sampleArticles })

    const itemCount = (xml.match(/<item>/g) ?? []).length
    expect(itemCount).toBe(2)
    expect(xml).toContain(`<link>${siteUrl}/articles/abc123</link>`)
    expect(xml).toContain(`<link>${siteUrl}/articles/def456</link>`)
    expect(xml).toContain('<title>最初の記事</title>')
  })

  it('guid は記事ページ URL を isPermaLink=true で持つ', () => {
    const xml = buildRssFeed({ siteUrl, articles: sampleArticles })

    expect(xml).toContain(
      `<guid isPermaLink="true">${siteUrl}/articles/abc123</guid>`,
    )
  })

  it('pubDate を RFC822（UTC）形式で出力する', () => {
    const xml = buildRssFeed({ siteUrl, articles: sampleArticles })

    expect(xml).toContain('<pubDate>Tue, 30 Jun 2026 12:00:00 GMT</pubDate>')
    expect(xml).toContain('<pubDate>Mon, 29 Jun 2026 09:30:00 GMT</pubDate>')
  })

  it('lastBuildDate に buildDate を反映する', () => {
    const xml = buildRssFeed({
      siteUrl,
      articles: sampleArticles,
      buildDate: new Date('2026-07-01T00:00:00.000Z'),
    })

    expect(xml).toContain(
      '<lastBuildDate>Wed, 01 Jul 2026 00:00:00 GMT</lastBuildDate>',
    )
  })

  it('タイトルの XML 特殊文字をエスケープする', () => {
    const xml = buildRssFeed({
      siteUrl,
      articles: [
        {
          publicId: 'xyz',
          title: 'A & B <tag> "quote" \'apos\'',
          publishedAt: '2026-06-30T12:00:00.000Z',
        },
      ],
    })

    expect(xml).toContain(
      '<title>A &amp; B &lt;tag&gt; &quot;quote&quot; &apos;apos&apos;</title>',
    )
    expect(xml).not.toContain('<tag>')
  })

  it('記事が 0 件でも妥当な空フィードを返す', () => {
    const xml = buildRssFeed({ siteUrl, articles: [] })

    expect(xml).toContain('<channel>')
    expect(xml).toContain('</channel>')
    expect(xml).not.toContain('<item>')
  })

  it('siteUrl の末尾スラッシュを正規化して二重スラッシュを防ぐ', () => {
    const xml = buildRssFeed({
      siteUrl: 'https://blog.example.com/',
      articles: sampleArticles,
    })

    expect(xml).toContain('<link>https://blog.example.com</link>')
    expect(xml).toContain('<link>https://blog.example.com/articles/abc123</link>')
    expect(xml).toContain(
      '<atom:link href="https://blog.example.com/api/public/feed.xml" rel="self" type="application/rss+xml"/>',
    )
    expect(xml).not.toContain('//articles/')
    expect(xml).not.toContain('com//')
  })
})
