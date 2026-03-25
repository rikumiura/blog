import { expect, test } from '@playwright/test'
import { setupApiMock } from './helpers/api-mock'

test.describe('ブログ読者の記事閲覧ストーリー', () => {
  test('トップページで公開記事一覧を見て、記事を選んで読み、一覧に戻る', async ({
    page,
  }) => {
    await setupApiMock(page)

    // トップページへアクセス
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: 'ブログ', exact: true }),
    ).toBeVisible()

    // 公開記事のみが表示されていること
    await expect(page.getByText('はじめてのブログ記事')).toBeVisible()
    await expect(page.getByText('TypeScriptの型システム入門')).toBeVisible()

    // 下書き・予約記事は表示されないこと
    await expect(page.getByText('下書きの記事')).not.toBeVisible()
    await expect(page.getByText('予約公開テスト記事')).not.toBeVisible()

    // タグが表示されていること
    await expect(
      page.getByRole('button', { name: '日記' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'TypeScript' }),
    ).toBeVisible()

    // 記事をクリックして詳細ページへ遷移
    await page
      .getByRole('heading', { name: 'はじめてのブログ記事' })
      .click()
    await page.waitForURL('**/articles/pub-001')

    // 記事の詳細が表示されること
    await expect(
      page.locator('header').getByRole('heading', { name: 'はじめてのブログ記事' }),
    ).toBeVisible()

    // 一覧に戻る
    await page.getByRole('link', { name: '記事一覧に戻る' }).click()
    await page.waitForURL('/')
    await expect(
      page.getByRole('heading', { name: 'ブログ', exact: true }),
    ).toBeVisible()
  })

  test('タグでフィルタリングして記事を絞り込む', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/')
    await expect(page.getByText('はじめてのブログ記事')).toBeVisible()
    await expect(page.getByText('TypeScriptの型システム入門')).toBeVisible()

    // 「技術」タグでフィルタリング
    await page.getByRole('button', { name: '技術' }).click()

    // 「技術」タグがある記事のみ表示される
    await expect(page.getByText('TypeScriptの型システム入門')).toBeVisible()
    await expect(page.getByText('はじめてのブログ記事')).not.toBeVisible()

    // フィルタをクリアして全件表示に戻る
    await page.getByRole('button', { name: 'クリア' }).click()
    await expect(page.getByText('はじめてのブログ記事')).toBeVisible()
    await expect(page.getByText('TypeScriptの型システム入門')).toBeVisible()
  })
})
