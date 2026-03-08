import { expect, test } from '@playwright/test'

test('トップページが表示される', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: '記事一覧' })).toBeVisible()
  await expect(page.getByRole('link', { name: '新規作成' })).toBeVisible()
})

test('/articles はトップページへリダイレクトされる', async ({ page }) => {
  await page.goto('/articles')

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: '記事一覧' })).toBeVisible()
})
