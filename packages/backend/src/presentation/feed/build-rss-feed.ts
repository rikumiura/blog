/** フィードに含める1記事分の情報（本文は含めない） */
export type FeedArticle = {
  publicId: string
  title: string
  /** 公開日時（ISO 8601 文字列） */
  publishedAt: string
}

export type BuildRssFeedInput = {
  /** サイトのベース URL（末尾スラッシュなしを想定） */
  siteUrl: string
  /** 公開日時の降順に並んだ記事一覧 */
  articles: FeedArticle[]
  /** フィードの生成日時。省略時は現在時刻 */
  buildDate?: Date
}

const CHANNEL_TITLE = 'ブログ'
const CHANNEL_DESCRIPTION = '公開記事の最新フィード'
const FEED_PATH = '/api/public/feed.xml'

/** XML テキストノード・属性値で使用できないよう特殊文字をエスケープする */
function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

/** ISO 日時文字列を RFC822（RSS の pubDate 形式）に変換する */
function toRfc822(isoDate: string): string {
  return new Date(isoDate).toUTCString()
}

/** 1記事を RSS の `<item>` 要素文字列に変換する。siteUrl は正規化済みを想定 */
function buildItem(siteUrl: string, article: FeedArticle): string {
  const articleUrl = `${siteUrl}/articles/${article.publicId}`
  return [
    '    <item>',
    `      <title>${escapeXml(article.title)}</title>`,
    `      <link>${escapeXml(articleUrl)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>`,
    `      <pubDate>${toRfc822(article.publishedAt)}</pubDate>`,
    '    </item>',
  ].join('\n')
}

/**
 * 公開記事一覧から RSS 2.0 フィードの XML 文字列を生成する純粋関数。
 * 記事リンクはフロントの記事ページ（`/articles/:publicId`）に合わせる。
 */
export function buildRssFeed(input: BuildRssFeedInput): string {
  const { siteUrl, articles, buildDate = new Date() } = input
  // 末尾スラッシュを除去し、URL 連結時の二重スラッシュを防ぐ
  const baseUrl = siteUrl.replace(/\/+$/, '')
  const feedUrl = `${baseUrl}${FEED_PATH}`

  const items = articles.map((article) => buildItem(baseUrl, article))

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(CHANNEL_TITLE)}</title>`,
    `    <link>${escapeXml(baseUrl)}</link>`,
    `    <description>${escapeXml(CHANNEL_DESCRIPTION)}</description>`,
    '    <language>ja</language>',
    `    <lastBuildDate>${buildDate.toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}
