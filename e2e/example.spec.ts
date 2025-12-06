import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/NabeFeed/);
});

test('shows neighborhood heading', async ({ page }) => {
  await page.goto('/');

  // Expects the page to have a heading with the name of "Neighborhood Feed".
  await expect(page.getByRole('heading', { name: '邻里新鲜事' })).toBeVisible();
});
