import { test, expect } from '@playwright/test';

test.describe('02: Multilingual Visibility & Layout Modes', () => {
	test('toggles version chips in header and switches layout modes', async ({ page }) => {
		await page.goto('/af/1CLE/1');

		// Wait for sections to load
		await expect(page.locator('.section-row').first()).toBeVisible({ timeout: 15000 });

		// Check for header version chips
		const chips = page.locator('button[title^="Toggle"]');
		const chipCount = await chips.count();
		expect(chipCount).toBeGreaterThanOrEqual(2);

		// Press 'd' to toggle Dual mode (Parallel <-> Stacked)
		await page.keyboard.press('d');
		// When stacked, section row has flex-col
		await expect(page.locator('.section-row').first()).toHaveClass(/flex-col/);

		// Press 'p' to return to Parallel mode
		await page.keyboard.press('p');
		await expect(page.locator('.section-row').first()).toHaveClass(/grid/);
	});
});
