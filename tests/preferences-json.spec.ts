import { test, expect, type Page } from '@playwright/test';

async function openJson(page: Page, value: unknown) {
  await page.goto('/');
  await page.getByRole('button', { name: 'JSON Tools', exact: true }).click();
  await page.getByLabel('JSON Input', { exact: true }).fill(JSON.stringify(value));
  await expect(page.locator('[data-json-node]').first()).toBeVisible();
}

test('theme defaults to the OS, follows changes, and remembers explicit choices', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByLabel('Theme')).toHaveValue('auto');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByLabel('Theme').selectOption('dark');
  await page.reload();
  await expect(page.getByLabel('Theme')).toHaveValue('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Theme').selectOption('light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByLabel('Theme').selectOption('auto');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByLabel('Theme')).toHaveValue('auto');
});

test('dark mode applies readable surfaces to every tool and About', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Theme').selectOption('dark');
  for (const name of ['Smart Converter', 'Diff Master', 'List Wizard', 'Time Converter', 'JSON Tools']) {
    await page.getByRole('button', { name, exact: true }).click();
    const textarea = page.locator('textarea').first();
    const colors = await textarea.evaluate(element => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, color: style.color };
    });
    expect(colors.background).not.toBe('rgb(255, 255, 255)');
    expect(colors.color).not.toBe('rgb(28, 25, 23)');
    if (name === 'JSON Tools') {
      await expect(page.getByRole('button', { name: 'Immersive view' })).not.toHaveCSS('background-color', 'rgb(245, 245, 244)');
    }
  }
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const card = page.locator('.bg-white').first();
  await expect(card).not.toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test('Enter cycles matching nodes, reveals collapsed ancestors and scrolls the tree', async ({ page }) => {
  await openJson(page, {
    first: 'needle',
    filler: Array.from({ length: 80 }, (_, i) => `filler ${i}`),
    nested: { last: 'Needle' },
  });
  await page.getByRole('button', { name: 'Collapse all' }).click();
  const search = page.getByRole('searchbox', { name: 'Search JSON tree' });
  await search.fill('needle');
  await search.press('Enter');
  await expect(page.getByRole('status', { name: 'Search results' })).toHaveText('1 of 2');
  await expect(page.locator('[data-search-active="true"]')).toContainText('"first"');
  await page.getByRole('button', { name: 'Expand all' }).click();
  const pageScroll = await page.evaluate(() => window.scrollY);
  await search.press('Enter');
  await expect(page.getByRole('status', { name: 'Search results' })).toHaveText('2 of 2');
  const active = page.locator('[data-search-active="true"]');
  await expect(active).toContainText('"last"');
  const bounds = await active.boundingBox();
  const treeBounds = await page.getByRole('region', { name: 'JSON tree' }).boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(treeBounds!.y);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(treeBounds!.y + treeBounds!.height);
  expect(await page.getByRole('region', { name: 'JSON tree' }).evaluate(element => element.scrollTop)).toBeGreaterThan(100);
  expect(await page.evaluate(() => window.scrollY)).toBe(pageScroll);
  await expect(search).toBeFocused();
  await search.press('Enter');
  await expect(page.getByRole('status', { name: 'Search results' })).toHaveText('1 of 2');
  await search.press('Shift+Enter');
  await expect(page.getByRole('status', { name: 'Search results' })).toHaveText('2 of 2');
  await search.fill('missing');
  await search.press('Enter');
  await expect(page.getByRole('status', { name: 'Search results' })).toHaveText('0 of 0');
  await expect(page.locator('[data-search-active="true"]')).toHaveCount(0);
});

test('search includes booleans, null and numbers and keeps unusual keys distinct', async ({ page }) => {
  await openJson(page, { 'a.b': 'match', a: { b: 'match' }, flag: false, nothing: null, count: 123 });
  const search = page.getByRole('searchbox', { name: 'Search JSON tree' });
  await search.fill('match');
  await search.press('Enter');
  const first = await page.locator('[data-search-active="true"]').getAttribute('data-json-node');
  await search.press('Enter');
  const second = await page.locator('[data-search-active="true"]').getAttribute('data-json-node');
  expect(second).not.toBe(first);
  for (const [query, key] of [['false', 'flag'], ['null', 'nothing'], ['123', 'count']]) {
    await search.fill(query);
    await search.press('Enter');
    await expect(page.locator('[data-search-active="true"]')).toContainText(`"${key}"`);
  }
});

test('the JSON divider resizes with pointer and keyboard and survives reload', async ({ page }) => {
  await openJson(page, { hello: 'world' });
  const divider = page.getByRole('separator', { name: 'Resize JSON panes' });
  const initial = Number(await divider.getAttribute('aria-valuenow'));
  const box = await divider.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x - 200, box!.y + box!.height / 2);
  await page.mouse.up();
  const resized = Number(await divider.getAttribute('aria-valuenow'));
  expect(resized).toBeLessThan(initial - 10);
  const inputBounds = await page.getByLabel('JSON Input', { exact: true }).boundingBox();
  const treeBounds = await page.getByRole('region', { name: 'JSON tree' }).boundingBox();
  expect(treeBounds!.width).toBeGreaterThan(inputBounds!.width);
  await page.reload();
  await page.getByRole('button', { name: 'JSON Tools', exact: true }).click();
  await expect(divider).toHaveAttribute('aria-valuenow', String(resized));
  await divider.focus();
  await divider.press('ArrowRight');
  expect(Number(await divider.getAttribute('aria-valuenow'))).toBe(resized + 2);
  await divider.press('Home');
  await expect(divider).toHaveAttribute('aria-valuenow', '20');
  await divider.press('End');
  await expect(divider).toHaveAttribute('aria-valuenow', '80');
});

test('mobile JSON panes stack without a draggable divider', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openJson(page, { hello: 'world' });
  await expect(page.getByRole('separator', { name: 'Resize JSON panes' })).toBeHidden();
  const input = await page.getByLabel('JSON Input', { exact: true }).boundingBox();
  const tree = await page.getByRole('region', { name: 'JSON tree' }).boundingBox();
  expect(tree!.y).toBeGreaterThan(input!.y + input!.height);
});

test('immersive single pane keeps Paste, search and tree, and Escape restores the editor', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openJson(page, { existing: 'needle' });
  await page.getByRole('button', { name: 'Immersive view' }).click();
  await expect(page.getByRole('banner')).toHaveCount(0);
  await expect(page.getByLabel('JSON Input', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('JQ Filter', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('toolbar', { name: 'Immersive layout' }).getByRole('button')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Paste', exact: true })).toHaveCount(1);
  await page.evaluate(() => navigator.clipboard.writeText('{"pasted":"needle","other":"needle"}'));
  await page.getByRole('button', { name: 'Paste', exact: true }).click();
  await expect(page.getByRole('region', { name: 'JSON tree' })).toContainText('"pasted"');
  const search = page.getByRole('searchbox', { name: 'Search JSON tree' });
  await search.fill('needle');
  await search.press('Enter');
  await search.press('Enter');
  await expect(page.getByRole('status', { name: 'Search results' })).toHaveText('2 of 2');
  await expect(page.locator('[data-search-active="true"]')).toContainText('"other"');
  await search.press('Escape');
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByLabel('JSON Input', { exact: true })).toHaveValue('{"pasted":"needle","other":"needle"}');
});

test('immersive clipboard failures and invalid JSON show errors and allow retry', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openJson(page, { existing: true });
  await page.getByRole('button', { name: 'Immersive view' }).click();
  await page.evaluate(() => navigator.clipboard.writeText('not json'));
  await page.getByRole('button', { name: 'Paste', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('[data-json-node]')).toHaveCount(0);
  await page.evaluate(() => navigator.clipboard.writeText('{"fixed":true}'));
  await page.getByRole('button', { name: 'Paste', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'JSON tree' })).toContainText('"fixed"');
  await context.clearPermissions();
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, 'readText', {
      value: () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')),
    });
  });
  await page.getByRole('button', { name: 'Paste', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('clipboard');
  await expect(page.getByRole('region', { name: 'JSON tree' })).toContainText('"fixed"');
});

test('valid primitive JSON roots render and search in the tree', async ({ page }) => {
  await openJson(page, false);
  const input = page.getByLabel('JSON Input', { exact: true });
  for (const text of ['false', '0', 'null', '""']) {
    await input.fill(text);
    await expect(page.getByRole('region', { name: 'JSON tree' })).toContainText(text);
    await expect(page.locator('[data-json-node]')).toHaveCount(1);
  }
});

test('existing JSON formatting, tree expansion and path-driven filters still work', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openJson(page, { users: [{ name: 'Ada' }, { name: 'Grace' }] });
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await expect(page.getByLabel('JSON Input', { exact: true })).toHaveValue('{\n  "users": [\n    {\n      "name": "Ada"\n    },\n    {\n      "name": "Grace"\n    }\n  ]\n}');
  await expect(page.locator('[data-json-node]')).toHaveCount(6);
  await page.getByRole('button', { name: 'Collapse users', exact: true }).click();
  await expect(page.getByRole('region', { name: 'JSON tree' })).not.toContainText('Ada');
  await page.getByRole('button', { name: 'Expand users', exact: true }).click();
  await page.locator('[data-json-node="$/users/0/name"] .text-sky-600').click();
  await expect(page.getByLabel('JQ Filter', { exact: true })).toHaveValue('.users[0].name');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.locator('pre')).toHaveText('"Ada"');
  await page.getByLabel('JQ Filter', { exact: true }).fill('.users[].name');
  await page.getByLabel('JQ Filter', { exact: true }).press('Enter');
  await expect(page.locator('pre')).toHaveText('[\n  "Ada",\n  "Grace"\n]');
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.locator('[data-json-node]')).toHaveCount(0);
  await expect(page.getByLabel('JQ Filter', { exact: true })).toBeEmpty();
});

test('Cmd/Ctrl+F focuses tree search and Shift+Enter starts from the last match', async ({ page }) => {
  await openJson(page, { one: 'needle', two: 'needle' });
  await page.getByLabel('JSON Input', { exact: true }).press('ControlOrMeta+f');
  const search = page.getByRole('searchbox', { name: 'Search JSON tree' });
  await expect(search).toBeFocused();
  await search.fill('needle');
  await search.press('Shift+Enter');
  await expect(page.locator('[data-search-active="true"]')).toContainText('"two"');
});

test('invalid saved preferences recover to safe defaults', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tooly.theme', '"invalid"');
    localStorage.setItem('tooly.jsonPaneWidth', '999');
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.getByLabel('Theme')).toHaveValue('auto');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'JSON Tools', exact: true }).click();
  await expect(page.getByRole('separator', { name: 'Resize JSON panes' })).toHaveAttribute('aria-valuenow', '50');
});

test('unavailable browser storage reports persistence failure without blocking changes', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage disabled', 'SecurityError'); };
  });
  await page.goto('/');
  await page.getByLabel('Theme').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('alert')).toContainText('could not be saved');
  await page.getByRole('button', { name: 'JSON Tools', exact: true }).click();
  const divider = page.getByRole('separator', { name: 'Resize JSON panes' });
  await divider.focus();
  await divider.press('ArrowLeft');
  await expect(divider).toHaveAttribute('aria-valuenow', '48');
  await expect(page.getByRole('alert')).toHaveCount(2);
});

test('copying a tree path still selects the filter when the Clipboard API is unavailable', async ({ page }) => {
  await openJson(page, { name: 'Ada' });
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined });
  });
  await page.locator('[data-json-node="$/name"] .text-sky-600').click();
  await expect(page.getByLabel('JQ Filter', { exact: true })).toHaveValue('.name');
  await expect(page.getByRole('alert')).toContainText('clipboard');
});
