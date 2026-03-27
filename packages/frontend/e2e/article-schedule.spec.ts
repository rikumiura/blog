import { expect, test } from '@playwright/test'
import { setupApiMock } from './helpers/api-mock'

test.describe('管理者の予約公開ストーリー', () => {
  test('下書き記事に予約公開を設定する', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: '記事一覧' })).toBeVisible()

    // 下書き記事の行の「予約公開」ボタンをクリック
    const row = page.getByRole('row').filter({ hasText: '下書きの記事' })
    await expect(row.getByText('下書き', { exact: true })).toBeVisible()
    await row.getByRole('button', { name: '予約公開' }).click()

    // 予約ダイアログが表示されること
    await expect(page.getByRole('heading', { name: '予約公開' })).toBeVisible()
    await expect(
      page.getByText('「下書きの記事」の公開日時を設定してください'),
    ).toBeVisible()

    // 日時入力欄にデフォルト値が設定されていること
    const dateInput = page.getByLabel('公開日時')
    await expect(dateInput).not.toHaveValue('')

    // 予約を確定
    await page.getByRole('button', { name: '予約する' }).click()

    // ステータスが「予約」に変わること
    await expect(row.getByText('予約', { exact: true })).toBeVisible()
  })

  test('予約ダイアログをキャンセルする', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/admin')

    // 下書き記事の行の「予約公開」ボタンをクリック
    const row = page.getByRole('row').filter({ hasText: '下書きの記事' })
    await row.getByRole('button', { name: '予約公開' }).click()

    // 予約ダイアログが表示される
    await expect(page.getByRole('heading', { name: '予約公開' })).toBeVisible()

    // キャンセルをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click()

    // ステータスが「下書き」のまま
    await expect(row.getByText('下書き', { exact: true })).toBeVisible()
  })

  test('予約済み記事の予約を取り消す', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/admin')

    // 予約記事の行を取得
    const row = page.getByRole('row').filter({ hasText: '予約公開テスト記事' })
    await expect(row.getByText('予約', { exact: true })).toBeVisible()

    // 「予約取消」ボタンをクリック
    await row.getByRole('button', { name: '予約取消' }).click()

    // ステータスが「下書き」に変わること
    await expect(row.getByText('下書き', { exact: true })).toBeVisible()
  })

  test('予約済み記事を今すぐ公開する', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/admin')

    // 予約記事の行を取得
    const row = page.getByRole('row').filter({ hasText: '予約公開テスト記事' })
    await expect(row.getByText('予約', { exact: true })).toBeVisible()

    // 「今すぐ公開」ボタンをクリック
    await row.getByRole('button', { name: '今すぐ公開' }).click()

    // ステータスが「公開」に変わること
    await expect(row.getByText('公開', { exact: true })).toBeVisible()
  })
})
