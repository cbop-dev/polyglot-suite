import { expect, test } from '@playwright/test';

test.describe('Apostolic Fathers Reader - Highlight Palette & Persistence', () => {
	test.beforeEach(async ({ page }) => {
		// Clear localStorage before test to ensure clean state
		await page.goto('/?work=1CLE&chapter=1');
		await page.evaluate(() => localStorage.clear());
		await page.reload();
		await expect(page.locator('.greek-font').first()).toBeVisible({ timeout: 15000 });
	});

	test('selects custom color from HighlightColorPicker and verifies localStorage persistence', async ({ page }) => {
		// 1. Locate word token for πεποιῆσθαι
		const token = page.locator('button', { hasText: /^πεποιῆσθαι$/ }).first();
		await expect(token).toBeVisible({ timeout: 10000 });
		await token.click();

		// 2. Open highlight toggle in DockableSidePanel
		const highlightToggleBtn = page.locator('button[title*="Highlight this lemma"]').first();
		await expect(highlightToggleBtn).toBeVisible({ timeout: 5000 });
		await highlightToggleBtn.click();

		// Assert token receives initial highlight
		await expect(token).toHaveClass(/hl-token/);

		// 3. Select Emerald from HighlightColorPicker
		const emeraldRadio = page.locator('button[role="radio"][aria-label="Emerald"]');
		await expect(emeraldRadio).toBeVisible({ timeout: 5000 });
		await emeraldRadio.click();

		// Assert radio is checked
		await expect(emeraldRadio).toHaveAttribute('aria-checked', 'true');

		// Verify word token inline style reflects Emerald (rgba(16, 185, 129...))
		await expect.poll(async () => {
			return await token.getAttribute('style');
		}).toContain('16, 185, 129');

		// 4. Reload page and assert persistence from localStorage
		await page.reload();
		await expect(page.locator('.greek-font').first()).toBeVisible({ timeout: 15000 });

		const reloadedToken = page.locator('button', { hasText: /^πεποιῆσθαι$/ }).first();
		await expect(reloadedToken).toHaveClass(/hl-token/);
		const reloadedStyle = await reloadedToken.getAttribute('style');
		expect(reloadedStyle).toContain('16, 185, 129');

		// 5. Cleanup: open side panel and remove highlight
		await reloadedToken.click();
		const removeHlBtn = page.locator('button[title*="Remove highlight"]').first();
		await expect(removeHlBtn).toBeVisible({ timeout: 5000 });
		await removeHlBtn.click();
		await expect(reloadedToken).not.toHaveClass(/hl-token/);
	});
});
