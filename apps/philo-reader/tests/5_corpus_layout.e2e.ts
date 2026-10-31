import { expect, test } from '@playwright/test';

test.describe('Philo Reader - Corpus Specific Layout', () => {
	test('renders Mangey coordinate badges and biblical citation apparatus in De Opificio Mundi', async ({ page }) => {
		await page.goto('/?work=OPIF&chapter=1&section=2');

		// Wait for reader content
		const greekText = page.locator('.greek-font').first();
		await expect(greekText).toBeVisible({ timeout: 15000 });

		// 1. Verify section badge and Mangey coordinate [M. 1.52]
		const sectionBadge = page.locator('button[title*="Cite section"]').first();
		await expect(sectionBadge).toBeVisible({ timeout: 10000 });

		const mangeyBadge = page.locator('span[title*="Mangey 1742 Milestone"]').first();
		await expect(mangeyBadge).toBeVisible({ timeout: 10000 });
		await expect(mangeyBadge).toContainText('M. 1.52');

		// 2. Verify parallel critical Greek and English translation column headers on desktop
		await expect(page.locator('text=Cohn-Wendland Greek Critical Text')).toBeVisible({ timeout: 10000 });
		await expect(page.locator('text=English Translation (C. D. Yonge / Supplements)')).toBeVisible({ timeout: 10000 });
	});
});
