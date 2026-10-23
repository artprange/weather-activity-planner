import { expect, test } from '@playwright/test';

import {
  Places,
  createForecast,
  mockGraphQL,
  searchPlaces,
  activityGroup,
} from './fixtures';

test('validates trimmed input without requests and supports no matches', async ({
  page,
}) => {
  await mockGraphQL(page, { empty: true });
  let requests = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/graphql')) requests++;
  });
  await page.goto('/');
  for (const query of ['', ' a ', ' ab ']) {
    await searchPlaces(page, query);
    await expect(
      page.getByText('Enter at least 3 characters.', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('searchbox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  }
  expect(requests).toBe(0);
  await searchPlaces(page, 'x'.repeat(101));
  await expect(
    page.getByText('Use no more than 100 characters.'),
  ).toBeVisible();
  expect(requests).toBe(0);
  await searchPlaces(page, ' Rio ');
  await expect(
    page.getByText('No locations found for “Rio”. Try another name.'),
  ).toBeVisible();
  expect(requests).toBe(1);
});

test('supports keyboard selection, internal scrolling and disclosure toggles', async ({
  page,
}) => {
  await mockGraphQL(page);
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to main content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const input = page.getByRole('searchbox');
  await input.fill('Santos');
  await input.press('Enter');
  await expect(page.getByRole('radio')).toHaveCount(10);
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Search locations', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  const summary = page
    .locator('summary')
    .filter({ hasText: 'Choose a location' });
  await expect(summary).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('radio').first()).toBeFocused();
  for (let index = 1; index < 10; index++)
    await page.keyboard.press('ArrowDown');
  const last = page.getByRole('radio').last();
  await expect(last).toBeChecked();
  await expect(last).toBeFocused();
  const list = page.locator('fieldset ul');
  expect(await list.evaluate((element) => element.scrollTop)).toBeGreaterThan(
    0,
  );
  const bounds = await last.boundingBox();
  const listBounds = await list.boundingBox();
  expect(bounds).not.toBeNull();
  expect(listBounds).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(listBounds!.y);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
    listBounds!.y + listBounds!.height,
  );
  await page.keyboard.press('Shift+Tab');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(list).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(list).toBeVisible();
});

test('pointer selection collapses results with visible focus and search reopens them', async ({
  page,
}) => {
  await mockGraphQL(page);
  await page.goto('/');
  await searchPlaces(page);
  await page.getByRole('radio').first().click();
  const summary = page
    .locator('summary')
    .filter({ hasText: 'Choose a location' });
  await expect(summary).toContainText('Selected: Santos, São Paulo, Brazil');
  await expect(summary).toBeFocused();
  await expect(page.locator('fieldset ul')).toBeHidden();
  await expect(
    page.getByRole('heading', {
      name: 'Santos, São Paulo, Brazil',
      exact: true,
    }),
  ).toBeVisible();
  await searchPlaces(page);
  await expect(page.locator('fieldset ul')).toBeVisible();
});

test('selects activities and chronological days with backend scores and explanatory cards', async ({
  page,
}) => {
  await mockGraphQL(page, { snowDepthCm: 30 });
  await page.goto('/?placeId=%223449433%22');
  const skiing = page.getByRole('tab', { name: /^Skiing/ });
  await skiing.focus();
  await skiing.press('ArrowRight');
  const surfing = page.getByRole('tab', { name: /^Surfing/ });
  await expect(surfing).toBeFocused();
  await expect(surfing).toHaveAttribute('aria-selected', 'true');
  for (const name of [
    'Skiing',
    'Surfing',
    'Outdoor sightseeing',
    'Indoor sightseeing',
  ]) {
    await page.getByRole('tab', { name: new RegExp(`^${name}`) }).click();
    const group = activityGroup(page, name);
    const days = group.getByRole('group', { name: 'Forecast days' });
    await expect(days.getByRole('button')).toHaveCount(7);
    expect(
      await days
        .locator('time')
        .evaluateAll((elements) =>
          elements.map((element) => element.getAttribute('datetime')),
        ),
    ).toEqual([
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ]);
    await days.getByRole('button').first().click();
    await days.getByRole('button').first().press('End');
    await expect(days.getByRole('button').last()).toBeFocused();
    await expect(days.getByRole('button').last()).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(group.locator('article')).toHaveCount(1);
    await expect(group.locator('article time').first()).toHaveAttribute(
      'datetime',
      '2026-10-26',
    );
    await expect(
      group.getByRole('button', { name: 'Next day', exact: true }),
    ).toBeDisabled();
  }
  await page.getByRole('tab', { name: /^Surfing/ }).click();
  await expect(
    activityGroup(page, 'Surfing')
      .locator('article')
      .getByText('88/100', { exact: true }),
  ).toBeVisible();
  await expect(
    activityGroup(page, 'Surfing')
      .locator('article')
      .getByText('Wave height', { exact: true }),
  ).toBeVisible();
});

test('preserves useful activities when marine data is missing', async ({
  page,
}) => {
  await mockGraphQL(page, { partial: true });
  await page.goto('/?placeId=%223449433%22');
  await expect(
    page.getByText(/Some activity scores are unavailable/),
  ).toBeVisible();
  await expect(page.getByRole('tab', { name: /^Surfing/ })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expect(
    page.getByRole('tab', { name: 'Outdoor sightseeing', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(
    page.getByRole('group', { name: 'Forecast days' }),
  ).toBeVisible();
  await expect(page.getByRole('tab', { name: /^Skiing/ })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
});

test('recovers from search HTTP errors and forecast GraphQL errors', async ({
  page,
}) => {
  await mockGraphQL(page, { searchFailures: 1, forecastFailures: 1 });
  await page.goto('/');
  await searchPlaces(page);
  await expect(
    page.getByText('Unable to search for locations. Please try again.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await page.getByRole('radio').first().click();
  await expect(
    page.getByText(
      'Unable to load the forecast. Try again or choose another location.',
    ),
  ).toBeVisible();
  await expect(page.getByText('Private server detail')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Try loading forecast again' })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Santos, São Paulo, Brazil',
      exact: true,
    }),
  ).toBeVisible();
});

test('restores the canonical place after refresh', async ({ page }) => {
  await mockGraphQL(page);
  await page.goto('/');
  await searchPlaces(page);
  await page.getByRole('radio').first().click();
  const title = page.getByRole('heading', {
    name: 'Santos, São Paulo, Brazil',
    exact: true,
  });
  await expect(title).toBeVisible();
  await page.reload();
  await expect(title).toBeVisible();
});

test('restores selections with browser back and forward', async ({ page }) => {
  await mockGraphQL(page);
  await page.goto('/');
  await searchPlaces(page);
  await page.getByRole('radio').first().click();
  const first = page.getByRole('heading', {
    name: 'Santos, São Paulo, Brazil',
    exact: true,
  });
  const second = page.getByRole('heading', {
    name: 'São Paulo, São Paulo, Brazil',
    exact: true,
  });
  await expect(first).toBeVisible();
  await page
    .locator('summary')
    .filter({ hasText: 'Choose a location' })
    .click();
  await page.getByRole('radio').nth(1).click();
  await expect(second).toBeVisible();
  await page.goBack();
  await expect(first).toBeVisible();
  await page.goForward();
  await expect(second).toBeVisible();
});

test('ignores a delayed forecast after selecting a different location', async ({
  page,
}) => {
  await mockGraphQL(page);
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started: (() => void) | undefined;
  const startedPromise = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route('**/graphql', async (route) => {
    const text = route.request().postData() ?? '';
    if (!text.includes('ActivityForecast') || !text.includes('3449433')) {
      await route.fallback();
      return;
    }
    started?.();
    await pending;
    await route.fulfill({
      json: { data: { activityForecast: createForecast(Places[0]!) } },
    });
  });
  await page.goto('/');
  await searchPlaces(page);
  await page.getByRole('radio').first().click();
  await startedPromise;
  await page
    .locator('summary')
    .filter({ hasText: 'Choose a location' })
    .click();
  await page.getByRole('radio').nth(1).click();
  const selected = page.getByRole('heading', {
    name: 'São Paulo, São Paulo, Brazil',
    exact: true,
  });
  await expect(selected).toBeVisible();
  release?.();
  await expect(selected).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Santos, São Paulo, Brazil',
      exact: true,
    }),
  ).toHaveCount(0);
});
