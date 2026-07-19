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

test('converts JSON to CSV', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Data Converter' }).click();
  await page.getByLabel('Input').fill('[{"name":"Ada","active":true}]');
  await page.getByRole('button', { name: 'Convert', exact: true }).click();

  await expect(page.getByLabel('Output')).toHaveValue('name,active\nAda,true');
});

test('tests a regular expression in a worker', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Regex Tester' }).click();
  await page.getByLabel('Regular Expression').fill('foo-(\\d+)');
  await page.getByLabel('Test Text').fill('foo-1 and foo-22');

  await expect(page.getByText('foo-1', { exact: true })).toBeVisible();
  await expect(page.getByText('foo-22', { exact: true })).toBeVisible();
});
