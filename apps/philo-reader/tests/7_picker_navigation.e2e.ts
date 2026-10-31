import { expect, test } from '@playwright/test';

test.describe('Philo Reader - Pickers & Command Palette Keyboard Navigation', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.greek-font').first()).toBeVisible({ timeout: 30000 });
	});

	test('navigates CommandPalette using ArrowDown, ArrowUp, and Enter keys', async ({ page }) => {
		// 1. Open CommandPalette
		await page.keyboard.press('ControlOrMeta+k');
		const input = page.locator('input[placeholder*="Jump to treatise or section"]');
		await expect(input).toBeVisible({ timeout: 10000 });

		// Type query with multiple matches
		await input.fill('Leg');

		// Verify matching items rendered
		const results = page.locator('div.max-h-80 button');
		await expect(results.first()).toBeVisible({ timeout: 5000 });
		const count = await results.count();
		expect(count).toBeGreaterThan(1);

		// ArrowDown to select 2nd item
		await input.press('ArrowDown');
		await expect(results.nth(1)).toHaveClass(/bg-blue/);

		// ArrowUp back to 1st item
		await input.press('ArrowUp');
		await expect(results.first()).toHaveClass(/bg-blue/);

		// ArrowDown again and press Enter
		await input.press('ArrowDown');
		await input.press('Enter');

		// Assert palette closes and reader navigated to treatise
		await expect(input).not.toBeVisible({ timeout: 5000 });
		await expect(page.locator('button[title*="Choose treatise"]')).toContainText(/Leg|Embassy|Laws/);
	});

	test('filters treatises in BookModal using category pills', async ({ page }) => {
		// 1. Open BookModal
		await page.keyboard.press('b');
		const filterInput = page.locator('input[placeholder*="Filter Philo\'s treatises"]');
		await expect(filterInput).toBeVisible({ timeout: 10000 });

		const modalList = page.locator('div.max-h-80');

		// Verify default "All Treatises" pill is active
		await expect(modalList.locator('text=On the Creation of the World').first()).toBeVisible();

		// 2. Click "Historical & Apologetic" pill
		const histPill = page.locator('button', { hasText: /Historical & Apologetic/ });
		await expect(histPill).toBeVisible({ timeout: 5000 });
		await histPill.click();

		// Assert On the Embassy to Gaius or Flaccus is visible, but On the Creation is hidden
		await expect(modalList.locator('text=On the Embassy to Gaius').first()).toBeVisible();
		await expect(modalList.locator('text=On the Creation of the World')).not.toBeVisible();

		// 3. Switch back to "All Treatises"
		const allPill = page.locator('button', { hasText: /All Treatises/ });
		await allPill.click();
		await expect(modalList.locator('text=On the Creation of the World').first()).toBeVisible();

		// Close modal
		await page.keyboard.press('Escape');
		await expect(filterInput).not.toBeVisible({ timeout: 5000 });
	});
});
