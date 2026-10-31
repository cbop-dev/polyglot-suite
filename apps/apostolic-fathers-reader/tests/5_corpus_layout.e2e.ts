import { expect, test } from '@playwright/test';

test.describe('Apostolic Fathers Reader - Corpus Specific Layout', () => {
	test('renders 3-column layout (Greek, Latin, English) when Latin text is extant in Polycarp Phil 10', async ({ page }) => {
		// Navigate to Polycarp to the Philippians, Chapter 10 (which preserves extant Latin text)
		await page.goto('/?work=POL_PHI&chapter=10');

		// Wait for reader content to load
		const greekText = page.locator('.greek-font').first();
		await expect(greekText).toBeVisible({ timeout: 15000 });

		// 1. Verify 3 column headers on desktop
		await expect(page.locator('text=Kirsopp Lake Greek (1912)')).toBeVisible({ timeout: 10000 });
		await expect(page.locator('text=Latin Text (Where Extant)')).toBeVisible({ timeout: 10000 });
		await expect(page.locator('text=Kirsopp Lake English Translation')).toBeVisible({ timeout: 10000 });

		// 2. Verify Latin column content is rendered
		const latinColumn = page.locator('.latin-font').first();
		await expect(latinColumn).toBeVisible({ timeout: 10000 });
		await expect(latinColumn).toContainText('10:');
	});
});
