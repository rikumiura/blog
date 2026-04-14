import { expect, test } from '@playwright/test'
import { setupApiMock } from './helpers/api-mock'

test.describe('ブログ読者のコメント機能', () => {
  test('公開記事のコメント一覧を閲覧できる', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/articles/pub-001')

    // コメントセクションの見出しが表示されること
    await expect(
      page.getByRole('heading', { name: /コメント/ }),
    ).toBeVisible()

    // モックのコメントが表示されること
    await expect(page.getByText('読者A')).toBeVisible()
    await expect(page.getByText('とても参考になりました！')).toBeVisible()
    await expect(page.getByText('読者B')).toBeVisible()
    await expect(page.getByText('続きも楽しみにしています。')).toBeVisible()
  })

  test('公開記事にコメントを投稿すると一覧に追加される', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/articles/pub-001')

    // コメント投稿フォームに入力
    await page.getByLabel('お名前').fill('新規ユーザー')
    await page.getByLabel('コメント').fill('はじめてコメントします！')

    // 投稿ボタンをクリック
    await page.getByRole('button', { name: 'コメントを投稿' }).click()

    // 新しいコメントが一覧に追加されること
    await expect(page.getByText('新規ユーザー')).toBeVisible()
    await expect(page.getByText('はじめてコメントします！')).toBeVisible()

    // 既存のコメントも残っていること
    await expect(page.getByText('読者A')).toBeVisible()
    await expect(page.getByText('読者B')).toBeVisible()
  })

  test('投稿後にフォームがリセットされる', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/articles/pub-001')

    await page.getByLabel('お名前').fill('テストユーザー')
    await page.getByLabel('コメント').fill('テスト投稿内容')
    await page.getByRole('button', { name: 'コメントを投稿' }).click()

    // 投稿後にフォームが空になること
    await expect(page.getByLabel('お名前')).toHaveValue('')
    await expect(page.getByLabel('コメント')).toHaveValue('')
  })
})

test.describe('管理者のコメント管理', () => {
  test('公開記事のコメントを管理画面で確認できる', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/admin/articles/pub-001')

    // コメントセクションが表示されること（件数付き）
    await expect(
      page.getByRole('heading', { name: /コメント/ }),
    ).toBeVisible()

    // コメントが表示されること
    await expect(page.getByText('読者A')).toBeVisible()
    await expect(page.getByText('とても参考になりました！')).toBeVisible()
    await expect(page.getByText('読者B')).toBeVisible()
    await expect(page.getByText('続きも楽しみにしています。')).toBeVisible()
  })

  test('管理者はコメントを削除できる', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/admin/articles/pub-001')

    // コメントが表示されていること
    await expect(page.getByText('読者A')).toBeVisible()
    await expect(page.getByText('読者B')).toBeVisible()

    // 読者A のコメントを削除する
    await page
      .locator('li')
      .filter({ hasText: '読者A' })
      .getByRole('button', { name: '削除' })
      .click()

    // 削除されたコメントが表示されなくなること
    await expect(page.getByText('読者A')).not.toBeVisible()
    await expect(page.getByText('とても参考になりました！')).not.toBeVisible()

    // 他のコメントは残っていること
    await expect(page.getByText('読者B')).toBeVisible()
    await expect(page.getByText('続きも楽しみにしています。')).toBeVisible()
  })
})
