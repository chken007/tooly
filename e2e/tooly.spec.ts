import { expect, test } from '@playwright/test';

test('filters JSON through the primary workflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'JSON Tools' })).toBeVisible();

  await page.getByLabel('JSON Input').fill(
    JSON.stringify({ users: [{ name: 'Ada' }, { name: 'Linus' }] }),
  );
  await page.getByLabel('JQ Filter').fill('.users[].name');
  await page.getByRole('button', { name: 'Apply' }).click();

  await expect(page.getByText('[\n  "Ada",\n  "Linus"\n]')).toBeVisible();
});

test('keeps the page within the mobile viewport', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile-only assertion');
  await page.goto('/');

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    page: document.documentElement.scrollWidth,
  }));

  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.getByRole('button', { name: 'Time Converter' })).toBeVisible();
});

