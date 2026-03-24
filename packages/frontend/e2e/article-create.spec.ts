import { expect, test } from '@playwright/test'
import { setupApiMock } from './helpers/api-mock'

test.describe('管理者の記事作成ストーリー', () => {
  test('新しい記事を下書きとして保存する', async ({ page }) => {
    await setupApiMock(page)

    // 管理画面へアクセス
    await page.goto('/admin')
    await expect(
      page.getByRole('heading', { name: '記事一覧' }),
    ).toBeVisible()

    // 新規作成ページへ遷移
    await page.getByRole('link', { name: '新規作成' }).click()
    await expect(page.url()).toContain('/admin/articles/new')
    await expect(
      page.getByRole('heading', { name: '記事を作成' }),
    ).toBeVisible()

    // タイトルを入力
    await page.getByLabel('タイトル').fill('テスト記事のタイトル')

    // タグを追加
    await page.getByLabel('タグ').fill('テスト')
    await page.getByRole('button', { name: '追加' }).click()
    await expect(page.getByText('テスト')).toBeVisible()

    // もう1つタグを追加
    await page.getByLabel('タグ').fill('E2E')
    await page.getByRole('button', { name: '追加' }).click()
    await expect(page.getByText('E2E')).toBeVisible()

    // 本文を入力
    await page
      .getByLabel('本文（Markdown）')
      .fill('# テスト記事\n\nこれはE2Eテストで作成した記事です。')

    // プレビュータブで内容を確認
    await page.getByRole('button', { name: 'プレビュー' }).click()
    await expect(page.getByText('テスト記事')).toBeVisible()

    // 編集タブに戻る
    await page
      .locator('form')
      .getByRole('button', { name: '編集' })
      .click()

    // 下書き保存
    await page.getByRole('button', { name: '下書き保存' }).click()

    // 記事一覧に戻り、作成した記事が表示されること
    await expect(
      page.getByRole('heading', { name: '記事一覧' }),
    ).toBeVisible()
    await expect(page.getByText('テスト記事のタイトル')).toBeVisible()
  })

  test('新しい記事を作成してそのまま公開する', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/admin/articles/new')
    await expect(
      page.getByRole('heading', { name: '記事を作成' }),
    ).toBeVisible()

    // タイトルと本文を入力
    await page.getByLabel('タイトル').fill('即時公開する記事')
    await page
      .getByLabel('本文（Markdown）')
      .fill('# 公開記事\n\nこの記事はすぐに公開されます。')

    // 「公開する」ボタンで送信
    await page.getByRole('button', { name: '公開する' }).click()

    // 記事一覧に戻ること
    await expect(
      page.getByRole('heading', { name: '記事一覧' }),
    ).toBeVisible()
    await expect(page.getByText('即時公開する記事')).toBeVisible()
  })
})
