import { expect, test } from '@playwright/test';
import { createForecast, Places, mockGraphQL } from './fixtures';

test('keeps a snowless tab visible, explains it on hover and keyboard focus, and never activates it', async ({
  page,
}) => {
  await mockGraphQL(page);
  await page.goto('/?placeId=%223449433%22');
  const skiing = page.getByRole('tab', { name: /^Skiing/ });
  const surfing = page.getByRole('tab', { name: /^Surfing/ });
  await expect(skiing).toBeVisible();
  await expect(skiing).toHaveAttribute('aria-disabled', 'true');
  await expect(skiing).toHaveAccessibleDescription(/No snow/);
  await expect(surfing).toHaveAttribute('aria-selected', 'true');
  await skiing.hover();
  await expect(page.getByRole('tooltip')).toContainText(
    'No snow in the evaluated activity windows',
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.mouse.move(0, 0);
  await surfing.focus();
  await surfing.press('ArrowLeft');
  await expect(skiing).toBeFocused();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await skiing.press('Enter');
  await skiing.press('Space');
  await expect(surfing).toHaveAttribute('aria-selected', 'true');
  await expect(skiing).toHaveAttribute('aria-selected', 'false');
});

for (const scenario of [
  {
    name: 'coastal coverage',
    options: { outsideMarineCoverage: true },
    reason: 'Outside coastal coverage',
  },
  { name: 'no waves', options: { waveHeightM: 0 }, reason: 'No waves' },
]) {
  test(`shows ${scenario.name} reason on mobile without hiding the tab`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockGraphQL(page, scenario.options);
    await page.goto('/?placeId=%223449433%22');
    const surfing = page.getByRole('tab', { name: /^Surfing/ });
    await expect(surfing).toBeVisible();
    await expect(surfing).toHaveAttribute('aria-disabled', 'true');
    await expect(surfing.getByText(scenario.reason)).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Outdoor sightseeing', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
  });
}

test('keeps skiing available and blocks surfing when its source is unavailable', async ({
  page,
}) => {
  await mockGraphQL(page, { snowDepthCm: 30, partial: true });
  await page.goto('/?placeId=%223449433%22');
  await expect(page.getByRole('tab', { name: /^Skiing/ })).toHaveAttribute(
    'aria-disabled',
    'false',
  );
  const surfing = page.getByRole('tab', { name: /^Surfing/ });
  await expect(surfing).toHaveAttribute('aria-disabled', 'true');
  await expect(surfing).toContainText('No forecast available');
  await surfing.hover();
  await expect(page.getByRole('tooltip')).toContainText(
    'Forecast source unavailable',
  );
  await expect(
    page
      .getByRole('group', { name: 'Forecast days' })
      .getByText('Unavailable', { exact: true }),
  ).toHaveCount(0);
});

test('distinguishes geographic restrictions from a marine outage', async ({
  page,
}) => {
  await mockGraphQL(page, { partial: true });
  await page.goto('/?placeId=%223448439%22');
  const surfing = page.getByRole('tab', { name: /^Surfing/ });
  await expect(surfing).toHaveAttribute('aria-disabled', 'true');
  await expect(surfing).toContainText('No nearby coast');
  await surfing.hover();
  await expect(page.getByRole('tooltip')).toContainText(
    'Try a nearby beach destination',
  );
  await page.goto('/?placeId=%223449433%22');
  await expect(surfing).toHaveAttribute('aria-disabled', 'true');
  await expect(surfing).toContainText('No forecast available');
  await surfing.hover();
  await expect(page.getByRole('tooltip')).toContainText(
    'Forecast source unavailable',
  );
  await expect(
    page
      .getByRole('group', { name: 'Forecast days' })
      .getByText('Unavailable', { exact: true }),
  ).toHaveCount(0);
});

for (const allUnavailable of [false, true]) {
  test(
    allUnavailable
      ? 'shows an accessible empty state when all activities are unavailable'
      : 'keeps partially available weeks inspectable',
    async ({ page }) => {
      const place = Places[0];
      if (!place) throw new Error('Missing fixture place');
      const forecast = createForecast(place, false, { snowDepthCm: 30 });
      const unavailable = createForecast(place, true).activities.find(
        (group) => group.activity === 'SURFING',
      );
      if (!unavailable) throw new Error('Missing surfing fixture');
      for (const group of forecast.activities) {
        group.days = group.days.map((day, index) =>
          allUnavailable || (group.activity === 'SURFING' && index === 0)
            ? { ...unavailable.days[index]!, activity: group.activity }
            : day,
        );
      }
      await page.route('**/graphql', (route) =>
        route.fulfill({ json: { data: { activityForecast: forecast } } }),
      );
      await page.goto('/?placeId=%223449433%22');
      if (allUnavailable) {
        await expect(
          page.getByText(
            'No activity forecasts are available for this location.',
            { exact: false },
          ),
        ).toBeVisible();
        await expect(
          page.getByRole('group', { name: 'Forecast days' }),
        ).toHaveCount(0);
        await expect(
          page.getByRole('tab', { name: /^Skiing/ }),
        ).toHaveAttribute('tabindex', '0');
      } else {
        const surfing = page.getByRole('tab', { name: /^Surfing/ });
        await expect(surfing).toHaveAttribute('aria-disabled', 'false');
        await surfing.click();
        await expect(
          page
            .getByRole('group', { name: 'Forecast days' })
            .getByText('Unavailable', { exact: true }),
        ).toHaveCount(1);
      }
    },
  );
}
