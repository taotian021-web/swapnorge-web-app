import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/NeighborBuy/);
});

test('shows neighborhood heading', async ({ page }) => {
  await page.goto('/');

  // Expects the page to have a heading with the name of What's new in your neighborhood?.
  await expect(page.getByRole('heading', { name: 'What\'s new in your neighborhood?' })).toBeVisible();
});
