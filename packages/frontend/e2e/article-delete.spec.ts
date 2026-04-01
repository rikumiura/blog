import { expect, test } from '@playwright/test'
import { setupApiMock } from './helpers/api-mock'

test.describe('管理者の記事削除ストーリー', () => {
  test('記事詳細から削除ダイアログを開き、キャンセルして削除しない', async ({
    page,
  }) => {
    await setupApiMock(page)

    // 記事詳細ページへ直接アクセス
    await page.goto('/admin/articles/draft-001')
    await expect(
      page.getByRole('heading', { name: '下書きの記事' }),
    ).toBeVisible()

    // 削除ボタンをクリック
    await page.getByRole('button', { name: '削除' }).click()

    // 削除ダイアログが表示されること
    await expect(
      page.getByText('「下書きの記事」を削除しますか？'),
    ).toBeVisible()
    await expect(page.getByText('この操作は取り消せません')).toBeVisible()

    // キャンセルをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click()

    // まだ詳細ページにいること
    await expect(
      page.getByRole('heading', { name: '下書きの記事' }),
    ).toBeVisible()
  })

  test('記事詳細から削除を実行し、一覧に戻る', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/admin/articles/draft-001')
    await expect(
      page.getByRole('heading', { name: '下書きの記事' }),
    ).toBeVisible()

    // 削除ボタンをクリック
    await page.getByRole('button', { name: '削除' }).click()

    // 削除ダイアログで「削除する」をクリック
    await page.getByRole('button', { name: '削除する' }).click()

    // 記事一覧に戻ること
    await expect(page.url()).toContain('/admin')
    await expect(page.getByRole('heading', { name: '記事一覧' })).toBeVisible()

    // 削除した記事が一覧に表示されないこと
    await expect(page.getByText('下書きの記事')).not.toBeVisible()
  })

  test('記事一覧から削除ダイアログを開いて削除する', async ({ page }) => {
    await setupApiMock(page)

    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: '記事一覧' })).toBeVisible()

    // 下書き記事の行の「削除」ボタンをクリック
    const row = page
      .getByRole('row')
      .filter({ hasText: 'Reactのパフォーマンス最適化' })
    await row.getByRole('button', { name: '削除' }).click()

    // 削除ダイアログが表示される
    await expect(
      page.getByText('「Reactのパフォーマンス最適化」を削除しますか？'),
    ).toBeVisible()

    // 削除を実行
    await page.getByRole('button', { name: '削除する' }).click()

    // 記事が一覧から消えること
    await expect(
      page.getByText('Reactのパフォーマンス最適化'),
    ).not.toBeVisible()
  })
})
