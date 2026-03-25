import { expect, test } from '@playwright/test'
import { setupApiMock } from './helpers/api-mock'

test.describe('管理者の記事編集・公開ストーリー', () => {
  test('記事一覧から詳細を開き、編集して保存する', async ({ page }) => {
    await setupApiMock(page)

    // 管理画面を開く
    await page.goto('/admin')
    await expect(
      page.getByRole('heading', { name: '記事一覧' }),
    ).toBeVisible()

    // 下書き記事のタイトルをクリックして詳細ページへ
    await page.getByRole('link', { name: '下書きの記事' }).click()
    await expect(page.url()).toContain('/admin/articles/draft-001')
    await expect(
      page.getByRole('heading', { name: '下書きの記事' }),
    ).toBeVisible()
    await expect(page.getByText('下書き', { exact: true })).toBeVisible()

    // 編集ボタンをクリック
    await page.getByRole('link', { name: '編集' }).click()
    await expect(page.url()).toContain('/admin/articles/draft-001/edit')
    await expect(
      page.getByRole('heading', { name: '記事を編集' }),
    ).toBeVisible()

    // タイトルを変更
    await page.getByLabel('タイトル').clear()
    await page.getByLabel('タイトル').fill('編集後の記事タイトル')

    // 本文を変更
    await page.getByLabel('本文（Markdown）').clear()
    await page
      .getByLabel('本文（Markdown）')
      .fill('# 編集後の記事\n\n本文を更新しました。')

    // 更新ボタンで保存
    await page.getByRole('button', { name: '更新する' }).click()

    // 詳細ページに戻り、変更が反映されていること
    await expect(
      page.getByRole('heading', { name: '編集後の記事タイトル' }),
    ).toBeVisible()
  })

  test('記事編集でキャンセルすると詳細ページに戻る', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/admin/articles/draft-001/edit')
    await expect(
      page.getByRole('heading', { name: '記事を編集' }),
    ).toBeVisible()

    // タイトルを変更する
    await page.getByLabel('タイトル').clear()
    await page.getByLabel('タイトル').fill('変更したけどキャンセル')

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click()

    // 詳細ページに戻ること（元のタイトルが表示される）
    await expect(page.url()).toContain('/admin/articles/draft-001')
    await expect(
      page.getByRole('heading', { name: '下書きの記事' }),
    ).toBeVisible()
  })

  test('下書き記事を一覧から直接公開する', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/admin')
    await expect(
      page.getByRole('heading', { name: '記事一覧' }),
    ).toBeVisible()

    // 下書き記事の行に「公開する」ボタンがあること
    const row = page.getByRole('row').filter({ hasText: '下書きの記事' })
    await expect(
      row.getByText('下書き', { exact: true }),
    ).toBeVisible()

    // 「公開する」をクリック
    await row.getByRole('button', { name: '公開する' }).click()

    // ステータスが「公開」に変わること
    await expect(
      row.getByText('公開', { exact: true }),
    ).toBeVisible()
  })
})
