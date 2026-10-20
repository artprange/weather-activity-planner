import { expect, test } from '@playwright/test';
import { mockGraphQL } from './fixtures';

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

test('leaves snow and missing-source activities available for inspection', async ({
  page,
}) => {
  await mockGraphQL(page, { snowDepthCm: 30, partial: true });
  await page.goto('/?placeId=%223449433%22');
  await expect(page.getByRole('tab', { name: /^Skiing/ })).toHaveAttribute(
    'aria-disabled',
    'false',
  );
  const surfing = page.getByRole('tab', { name: /^Surfing/ });
  await expect(surfing).toHaveAttribute('aria-disabled', 'false');
  await surfing.click();
  await expect(
    page.getByText('Score unavailable', { exact: true }),
  ).toBeVisible();
});

test('São Paulo capital disables surfing based on geography and Santos remains inspectable during a marine outage', async ({
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
  await expect(surfing).toHaveAttribute('aria-disabled', 'false');
  await surfing.click();
  await expect(
    page.getByText('Score unavailable', { exact: true }),
  ).toBeVisible();
});
