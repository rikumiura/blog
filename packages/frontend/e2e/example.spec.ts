import { test, expect } from '@playwright/test';

test('トップページが表示される', async ({ page }) => {
  await page.goto('/');

  // "Frontend: React Router v7 + Vite" のテキストが表示されていること
  await expect(page.getByText('Frontend: React Router v7 + Vite')).toBeVisible();
});

test('トップページに見出しが存在する', async ({ page }) => {
  await page.goto('/');

  // h1 要素が存在すること
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();
});
