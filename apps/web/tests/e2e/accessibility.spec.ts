import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { mockGraphQL, activityGroup } from './fixtures';

for (const theme of ['light', 'dark'] as const) {
  test(`has no detected WCAG violations with expanded forecasts in ${theme} theme`, async ({
    page,
  }, testInfo) => {
    await mockGraphQL(page, { partial: true });
    await page.goto('/?placeId=%223449433%22');
    await page
      .getByRole('combobox', { name: 'Theme', exact: true })
      .selectOption(theme);
    await expect(
      page.getByRole('heading', {
        name: 'Santos, São Paulo, Brazil',
        exact: true,
      }),
    ).toBeVisible();
    for (const name of [
      'Skiing',
      'Surfing',
      'Outdoor sightseeing',
      'Indoor sightseeing',
    ]) {
      await activityGroup(page, name).locator('summary').first().click();
    }
    await page.locator('article details').evaluateAll((elements) => {
      for (const element of elements)
        if (element instanceof HTMLDetailsElement) element.open = true;
    });
    await expect(
      activityGroup(page, 'Outdoor sightseeing').getByText('Good', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      activityGroup(page, 'Outdoor sightseeing').getByText('Fair', {
        exact: true,
      }),
    ).toBeVisible();
    await testInfo.attach('expanded-forecast', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('has accessible validation and expanded location results', async ({
  page,
}) => {
  await mockGraphQL(page);
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Search locations', exact: true })
    .click();
  const input = page.getByRole('searchbox');
  await expect(input).toHaveAccessibleDescription(
    'Enter at least 3 characters.',
  );
  const validationResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(validationResults.violations).toEqual([]);
  await input.fill('Santos');
  await input.press('Enter');
  await expect(page.getByRole('radio')).toHaveCount(10);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('reflows at 320 CSS pixels with reduced motion and expanded details', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockGraphQL(page);
  await page.goto('/?placeId=%223449433%22');
  await expect(
    page.getByRole('heading', {
      name: 'Santos, São Paulo, Brazil',
      exact: true,
    }),
  ).toBeVisible();
  for (const name of [
    'Skiing',
    'Surfing',
    'Outdoor sightseeing',
    'Indoor sightseeing',
  ]) {
    await activityGroup(page, name).locator('summary').first().click();
  }
  await page.locator('article details').evaluateAll((elements) => {
    for (const element of elements)
      if (element instanceof HTMLDetailsElement) element.open = true;
  });
  const widths = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport);
  await expect(page.getByRole('combobox', { name: 'Theme' })).toBeVisible();
  await testInfo.attach('mobile-reflow', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});
