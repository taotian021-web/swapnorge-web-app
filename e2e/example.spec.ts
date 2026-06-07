import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect the app title to include the project name
  await expect(page).toHaveTitle(/SwapNorge/);
});

test('shows a visible heading on the homepage', async ({ page }) => {
  await page.goto('/');

  // Expect the page to have at least one visible heading element
  await expect(page.getByRole('heading').first()).toBeVisible();
});
