import { expect, test } from '@playwright/test'

test('記事一覧ページに記事が表示される', async ({ page }) => {
  await page.goto('/articles')

  // 記事一覧の見出しが表示されること
  await expect(page.getByRole('heading', { name: '記事一覧' })).toBeVisible()

  // テーブルに記事が表示されていること
  await expect(page.getByText('はじめてのブログ記事')).toBeVisible()
})
