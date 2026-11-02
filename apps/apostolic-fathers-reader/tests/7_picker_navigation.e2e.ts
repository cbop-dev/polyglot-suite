import { expect, test } from '@playwright/test';

test.describe('Apostolic Fathers Reader - Pickers & Command Palette Keyboard Navigation', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.greek-font').first()).toBeVisible({ timeout: 15000 });
	});

	test('navigates CommandPalette using ArrowDown, ArrowUp, and Enter keys', async ({ page }) => {
		// 1. Open CommandPalette
		await page.keyboard.press('ControlOrMeta+k');
		const input = page.locator('input[placeholder*="Type a work or reference"]');
		await expect(input).toBeVisible({ timeout: 5000 });

		// Type query with multiple matches
		await input.fill('Ign');

		// Verify matching items rendered
		const results = page.locator('button', { hasText: /Ignatius/ });
		await expect(results.first()).toBeVisible({ timeout: 5000 });
		const count = await results.count();
		expect(count).toBeGreaterThan(1);

		// First item should be selected by default
		await expect(results.first()).toHaveClass(/bg-blue/);

		// ArrowDown directly on the input to select 2nd item
		await input.press('ArrowDown');
		await expect(results.nth(1)).toHaveClass(/bg-blue/);

		// ArrowUp back to 1st item
		await input.press('ArrowUp');
		await expect(results.first()).toHaveClass(/bg-blue/);

		// ArrowDown again and press Enter
		await input.press('ArrowDown');
		await input.press('Enter');

		// Assert palette closes and reader navigated away from 1CLE
		await expect(input).not.toBeVisible({ timeout: 5000 });
		await expect(page.locator('header')).toContainText('Ignatius');
	});

	test('filters works in BookModal and selects top match with Enter', async ({ page }) => {
		// 1. Open BookModal
		await page.keyboard.press('b');
		const filterInput = page.locator('input[placeholder*="Filter works"]');
		await expect(filterInput).toBeVisible({ timeout: 5000 });

		// Type 'Didache'
		await filterInput.fill('Didache');

		// Top match should be Didache
		const didacheBtn = page.locator('button', { hasText: /Didache/ }).first();
		await expect(didacheBtn).toBeVisible({ timeout: 5000 });

		// Press Enter on the input
		await filterInput.press('Enter');

		// Verify reader navigated to Didache
		await expect(filterInput).not.toBeVisible({ timeout: 5000 });
		await expect(page.locator('header')).toContainText('Didache');
	});
});
