import { test, expect, type Page, type Locator } from '@playwright/test';

const pane = (page: Page, number: number) =>
  page.getByRole('region', { name: `JSON pane ${number}`, exact: true });

async function enterImmersive(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'JSON Tools', exact: true }).click();
  await page.getByLabel('JSON Input', { exact: true }).fill('{"original":"needle"}');
  await expect(page.getByRole('region', { name: 'JSON tree' })).toContainText('"original"');
  await page.getByRole('button', { name: 'Immersive view' }).click();
}

async function pasteJson(page: Page, target: Locator, value: Record<string, unknown>) {
  const text = JSON.stringify(value);
  await page.evaluate(text => navigator.clipboard.writeText(text), text);
  await target.getByRole('button', { name: 'Paste', exact: true }).click();
  await expect(target.getByRole('region', { name: 'JSON tree' })).toContainText(JSON.stringify(Object.keys(value)[0]));
}

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
});

test('four highlighted layout icons exist only in immersive mode and create the requested geometry', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('toolbar', { name: 'Immersive layout' })).toHaveCount(0);
  await enterImmersive(page);
  const toolbar = page.getByRole('toolbar', { name: 'Immersive layout' });
  await expect(toolbar.getByRole('button')).toHaveCount(4);
  for (const [name, rectangles] of [['Single pane', 1], ['Side by side', 2], ['Top and bottom', 2], ['Four panes', 4]] as const) {
    await expect(toolbar.getByRole('button', { name, exact: true }).locator('rect')).toHaveCount(rectangles);
  }
  await expect(toolbar.getByRole('button', { name: 'Single pane', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(pane(page, 1)).toBeVisible();
  await expect(pane(page, 2)).toHaveCount(0);

  await toolbar.getByRole('button', { name: 'Side by side', exact: true }).click();
  await expect(toolbar.getByRole('button', { name: 'Side by side', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const selectedColor = await toolbar.getByRole('button', { name: 'Side by side', exact: true })
    .evaluate(element => getComputedStyle(element).backgroundColor);
  const unselectedColor = await toolbar.getByRole('button', { name: 'Single pane', exact: true })
    .evaluate(element => getComputedStyle(element).backgroundColor);
  expect(selectedColor).not.toBe(unselectedColor);
  let first = await pane(page, 1).boundingBox();
  let second = await pane(page, 2).boundingBox();
  expect(second!.x).toBeGreaterThan(first!.x + first!.width);
  expect(second!.y).toBe(first!.y);
  expect(Math.abs(second!.width - first!.width)).toBeLessThan(2);
  expect(Math.abs(second!.height - first!.height)).toBeLessThan(2);

  await toolbar.getByRole('button', { name: 'Top and bottom', exact: true }).click();
  first = await pane(page, 1).boundingBox();
  second = await pane(page, 2).boundingBox();
  expect(second!.y).toBeGreaterThan(first!.y + first!.height);
  expect(second!.x).toBe(first!.x);
  expect(Math.abs(second!.height - first!.height)).toBeLessThan(2);

  await toolbar.getByRole('button', { name: 'Four panes', exact: true }).click();
  first = await pane(page, 1).boundingBox();
  second = await pane(page, 2).boundingBox();
  const third = await pane(page, 3).boundingBox();
  const fourth = await pane(page, 4).boundingBox();
  expect(second!.x).toBeGreaterThan(first!.x + first!.width);
  expect(third!.y).toBeGreaterThan(first!.y + first!.height);
  expect(third!.x).toBe(first!.x);
  expect(fourth!.x).toBe(second!.x);
  expect(fourth!.y).toBe(third!.y);
  await expect(toolbar.locator('[aria-pressed="true"]')).toHaveCount(1);
  await expect(toolbar.getByRole('button', { name: 'Four panes', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Paste', exact: true })).toHaveCount(4);
  await expect(page.getByRole('searchbox', { name: 'Search JSON tree' })).toHaveCount(4);
});

test('every pane has independent content, search navigation and tree expansion', async ({ page }) => {
  await enterImmersive(page);
  await page.getByRole('button', { name: 'Four panes', exact: true }).click();
  for (let number = 1; number <= 4; number++) {
    await pasteJson(page, pane(page, number), { [`pane${number}`]: { first: 'needle', second: 'needle' } });
    await expect(pane(page, number).getByRole('region', { name: 'JSON tree' })).toContainText(`"pane${number}"`);
    const search = pane(page, number).getByRole('searchbox');
    await search.fill('needle');
    await search.press('Enter');
    if (number % 2 === 0) await search.press('Enter');
  }
  for (let number = 1; number <= 4; number++) {
    await expect(pane(page, number).getByRole('status', { name: 'Search results' })).toHaveText(`${number % 2 === 0 ? 2 : 1} of 2`);
    await expect(pane(page, number).locator('[data-search-active="true"]')).toContainText(number % 2 === 0 ? '"second"' : '"first"');
    for (let other = 1; other <= 4; other++) {
      if (other !== number) await expect(pane(page, number)).not.toContainText(`"pane${other}"`);
    }
  }
  await pane(page, 2).getByRole('button', { name: 'Collapse pane2', exact: true }).click();
  await expect(pane(page, 2).getByRole('region', { name: 'JSON tree' })).not.toContainText('"first"');
  await expect(pane(page, 1).getByRole('region', { name: 'JSON tree' })).toContainText('"first"');
  await pane(page, 2).getByRole('searchbox').press('Shift+Enter');
  await expect(pane(page, 2).locator('[data-search-active="true"]')).toContainText('"first"');
});

test('hidden pane content and searches survive layout switches and leaving immersive mode', async ({ page }) => {
  await enterImmersive(page);
  await page.getByRole('button', { name: 'Four panes', exact: true }).click();
  await pasteJson(page, pane(page, 1), { primary: 'needle' });
  await pasteJson(page, pane(page, 4), { fourth: { first: 'needle', second: 'needle' } });
  await expect(pane(page, 4).getByRole('region', { name: 'JSON tree' })).toContainText('"fourth"');
  const search = pane(page, 4).getByRole('searchbox');
  await search.fill('needle');
  await search.press('Enter');
  await search.press('Enter');
  await page.getByRole('button', { name: 'Single pane', exact: true }).click();
  await expect(pane(page, 4)).toHaveCount(0);
  await page.getByRole('button', { name: 'Side by side', exact: true }).click();
  await expect(pane(page, 2).getByRole('region', { name: 'JSON tree' })).toContainText('Tree view will appear here');
  await page.getByRole('button', { name: 'Four panes', exact: true }).click();
  await expect(search).toHaveValue('needle');
  await expect(pane(page, 4).getByRole('status', { name: 'Search results' })).toHaveText('2 of 2');
  await search.press('Escape');
  await expect(page.getByRole('toolbar', { name: 'Immersive layout' })).toHaveCount(0);
  await expect(page.getByLabel('JSON Input', { exact: true })).toHaveValue('{"primary":"needle"}');
  await page.getByRole('button', { name: 'Immersive view' }).click();
  await expect(pane(page, 4).getByRole('region', { name: 'JSON tree' })).toContainText('"fourth"');
  await expect(search).toHaveValue('needle');
  await expect(pane(page, 4).locator('[data-search-active="true"]')).toContainText('"second"');
});

test('Cmd/Ctrl+F selects the last-used visible pane and falls back when it is hidden', async ({ page }) => {
  await enterImmersive(page);
  await page.getByRole('button', { name: 'Four panes', exact: true }).click();
  await pane(page, 4).getByRole('region', { name: 'JSON tree' }).click();
  await page.keyboard.press('ControlOrMeta+f');
  await expect(pane(page, 4).getByRole('searchbox')).toBeFocused();
  await page.getByRole('button', { name: 'Top and bottom', exact: true }).click();
  await page.keyboard.press('ControlOrMeta+f');
  await expect(pane(page, 1).getByRole('searchbox')).toBeFocused();
});

test('search scrolls only its own pane and leaves the top-right icons stationary', async ({ page }) => {
  await enterImmersive(page);
  await page.getByRole('button', { name: 'Four panes', exact: true }).click();
  await pasteJson(page, pane(page, 4), { fillers: Array.from({ length: 80 }, (_, i) => i), last: 'needle' });
  await expect(pane(page, 4).getByRole('region', { name: 'JSON tree' })).toContainText('"last"');
  const lastIcon = page.getByRole('button', { name: 'Four panes', exact: true });
  const before = await lastIcon.boundingBox();
  const search = pane(page, 4).getByRole('searchbox');
  await search.fill('needle');
  await search.press('Enter');
  const ownTree = pane(page, 4).getByRole('region', { name: 'JSON tree' });
  expect(await ownTree.evaluate(element => element.scrollTop)).toBeGreaterThan(100);
  expect(await pane(page, 1).getByRole('region', { name: 'JSON tree' }).evaluate(element => element.scrollTop)).toBe(0);
  const active = await pane(page, 4).locator('[data-search-active="true"]').boundingBox();
  const tree = await ownTree.boundingBox();
  expect(active!.y).toBeGreaterThanOrEqual(tree!.y);
  expect(active!.y + active!.height).toBeLessThanOrEqual(tree!.y + tree!.height);
  expect(await lastIcon.boundingBox()).toEqual(before);
  expect(before!.x + before!.width).toBeGreaterThan(1400);
  expect(before!.y).toBeLessThan(25);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('invalid pasted JSON affects only its pane and recovers on the next paste', async ({ page }) => {
  await enterImmersive(page);
  await page.getByRole('button', { name: 'Side by side', exact: true }).click();
  await page.evaluate(() => navigator.clipboard.writeText('invalid JSON'));
  await pane(page, 2).getByRole('button', { name: 'Paste', exact: true }).click();
  await expect(pane(page, 2).getByRole('alert')).toBeVisible();
  await expect(pane(page, 1).getByRole('alert')).toHaveCount(0);
  await expect(pane(page, 1).getByRole('region', { name: 'JSON tree' })).toContainText('"original"');
  await pasteJson(page, pane(page, 2), { recovered: true });
  await expect(pane(page, 2).getByRole('alert')).toHaveCount(0);
  await expect(pane(page, 2).getByRole('region', { name: 'JSON tree' })).toContainText('"recovered"');
  await pane(page, 2).locator('[data-json-node="$/recovered"] .text-sky-600').click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('.recovered');
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, 'readText', {
      value: () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')),
    });
  });
  await pane(page, 2).getByRole('button', { name: 'Paste', exact: true }).click();
  await expect(pane(page, 2).getByRole('alert')).toContainText('clipboard');
  await expect(pane(page, 1).getByRole('alert')).toHaveCount(0);
  await pane(page, 2).getByRole('searchbox').press('Escape');
  await expect(page.getByLabel('JQ Filter', { exact: true })).toBeEmpty();
});

test('narrow four-pane layouts keep each search usable without overflowing the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterImmersive(page);
  await page.getByRole('button', { name: 'Four panes', exact: true }).click();
  for (let number = 1; number <= 4; number++) {
    const search = await pane(page, number).getByRole('searchbox').boundingBox();
    expect(search!.width).toBeGreaterThanOrEqual(120);
    expect(search!.x).toBeGreaterThanOrEqual(0);
    expect(search!.x + search!.width).toBeLessThanOrEqual(390);
    const tree = await pane(page, number).getByRole('region', { name: 'JSON tree' }).boundingBox();
    expect(tree!.height).toBeGreaterThan(200);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(844);
});
