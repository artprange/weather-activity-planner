import { expect, test } from '@playwright/test';

import { mockGraphQL, searchPlaces } from './fixtures';

for (const variant of ['forecast', 'locations'] as const) {
  test(`shows ${variant} placeholders only while waiting for data`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockGraphQL(page);
    let release = () => {};
    const responseReady = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/graphql', async (route) => {
      await responseReady;
      await route.fallback();
    });
    try {
      await page.goto(variant === 'forecast' ? '/?placeId=%223449433%22' : '/');
      if (variant === 'locations') await searchPlaces(page);
      const skeleton = page.locator(`[data-loading-skeleton="${variant}"]`);
      await expect(skeleton).toBeVisible();
      await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
      await expect(skeleton).toHaveCSS('animation-name', 'none');
      await expect(
        page.getByRole('status').filter({
          hasText:
            variant === 'forecast'
              ? 'Loading the seven-day forecast.'
              : 'Searching for',
        }),
      ).toBeVisible();
      release();
      await expect(skeleton).toHaveCount(0);
      if (variant === 'forecast') {
        await expect(
          page.getByRole('heading', {
            name: 'Santos, São Paulo, Brazil',
            exact: true,
          }),
        ).toBeVisible();
      } else {
        await expect(
          page.getByRole('group', { name: 'Location options' }),
        ).toBeVisible();
      }
    } finally {
      release();
    }
  });
}
