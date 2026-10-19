import { expect, test } from '@playwright/test';

test('follows live system preference and preserves an explicit override on reload', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const select = page.getByRole('combobox', { name: 'Theme', exact: true });
  await expect(select).toHaveValue('system');
  await expect(page.locator('html')).toHaveClass('dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).not.toHaveClass('dark');
  await select.selectOption('dark');
  await page.reload();
  await expect(select).toHaveValue('dark');
  await expect(page.locator('html')).toHaveClass('dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveClass('dark');
  await select.selectOption('system');
  await expect(page.locator('html')).not.toHaveClass('dark');
});

test('synchronizes theme changes across tabs', async ({ context, page }) => {
  await page.goto('/');
  const other = await context.newPage();
  await other.goto('/');
  await page.getByRole('combobox', { name: 'Theme' }).selectOption('dark');
  await expect(other.getByRole('combobox', { name: 'Theme' })).toHaveValue(
    'dark',
  );
  await expect(other.locator('html')).toHaveClass('dark');
  await other.getByRole('combobox', { name: 'Theme' }).selectOption('light');
  await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue(
    'light',
  );
  await expect(page.locator('html')).not.toHaveClass('dark');
});

test('keeps theme selection usable when storage is blocked', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Theme' }).selectOption('dark');
  await expect(page.locator('html')).toHaveClass('dark');
  expect(errors).toEqual([]);
});
