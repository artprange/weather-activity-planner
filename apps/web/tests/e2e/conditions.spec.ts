import { expect, test } from '@playwright/test';

import { mockGraphQL, activityGroup } from './fixtures';

test('shows selectable condition measurements and accessible values on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockGraphQL(page);
  await page.goto('/?placeId=%223449433%22');
  await expect(page.getByRole('figure')).toContainText('Santos');
  const surfing = activityGroup(page, 'Surfing');
  await page.getByRole('tab', { name: /^Surfing/ }).click();
  await surfing.getByLabel('Measurement').selectOption('WAVE_HEIGHT');
  await surfing.getByText('View chart values', { exact: true }).click();
  await expect(surfing.getByRole('table')).toContainText('Wave height');
  await expect(surfing.getByRole('table').getByRole('row')).toHaveCount(8);
  await surfing.getByLabel('Measurement').selectOption('WIND');
  await expect(surfing.getByRole('table')).toContainText('Wind');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('centers the selected location on the visible globe', async ({ page }) => {
  await mockGraphQL(page);
  await page.goto('/?placeId=%223449433%22');
  const figure = page.getByRole('figure');
  const marker = figure.locator('[style*="anchor-name"]');
  await expect(marker).toHaveCount(1);
  await expect
    .poll(async () =>
      marker.evaluate((element) => ({
        left: parseFloat((element as HTMLElement).style.left),
        top: parseFloat((element as HTMLElement).style.top),
      })),
    )
    .toEqual({ left: 50, top: 50 });
  await expect(figure.locator('canvas')).toHaveCount(1);
  await page.waitForTimeout(500);
  await figure.screenshot({ path: '/tmp/location-globe-fixed.png' });
});

test('mobile day carousel reveals the selected date and keeps the chart after explanatory cards', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockGraphQL(page);
  await page.goto('/?placeId=%223449433%22');
  await page.getByRole('tab', { name: /^Surfing/ }).click();
  const group = activityGroup(page, 'Surfing');
  const days = group.getByRole('group', { name: 'Forecast days' });
  await days.getByRole('button').first().focus();
  await page.keyboard.press('End');
  await expect(days.getByRole('button').last()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await days.evaluate((element) => element.scrollLeft)).toBeGreaterThan(
    0,
  );
  await expect(
    group.getByRole('button', { name: 'Next day', exact: true }),
  ).toBeDisabled();
  await group
    .getByRole('button', { name: 'Previous day', exact: true })
    .click();
  await expect(group.locator('article time').first()).toHaveAttribute(
    'datetime',
    '2026-10-25',
  );
  const details = await group.locator('article').boundingBox();
  const chart = await group
    .getByRole('region', { name: 'Weekly conditions' })
    .boundingBox();
  expect(chart!.y).toBeGreaterThan(details!.y + details!.height);
  await page.screenshot({ path: '/tmp/forecast-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: '/tmp/forecast-desktop.png', fullPage: true });
});
