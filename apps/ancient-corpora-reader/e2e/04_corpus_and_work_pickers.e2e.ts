import { test, expect } from '@playwright/test';

test.describe('04: Corpus & Work Pickers Navigation', () => {
	test('switches corpus via Corpus Picker modal', async ({ page }) => {
		await page.goto('/af');

		await expect(page.locator('.section-row').first()).toBeVisible({ timeout: 15000 });

		// Click corpus picker trigger in header
		await page.locator('.corpus-picker-trigger').click();

		// Modal should open
		const modal = page.locator('[role="dialog"], .modal-box').first();
		await expect(modal).toBeVisible();

		// Select Philo
		const philoOption = page.locator('text=Philo of Alexandria').first();
		await philoOption.click();

		// Header should update
		await expect(page.locator('.corpus-picker-trigger')).toContainText('Philo of Alexandria', { timeout: 10000 });
	});

	test('filters works via Work Picker modal', async ({ page }) => {
		await page.goto('/af');
		await expect(page.locator('.section-row').first()).toBeVisible({ timeout: 15000 });

		// Press 'w' hotkey to open Work Picker
		await page.keyboard.press('w');

		const modal = page.locator('[role="dialog"], .modal-box').first();
		await expect(modal).toBeVisible();

		// Type in search query "Polycarp"
		const searchInput = page.locator('input[type="text"], input[type="search"]').first();
		await searchInput.fill('Polycarp');

		// Click on Polycarp's Epistle to the Philippians
		const polyOption = page.locator('.work-picker-modal button, [role="dialog"] button').filter({ hasText: /Polycarp/i }).first();
		await polyOption.click();

		// Work should update in header
		await expect(page.locator('header, nav').first()).toContainText('Polycarp', { timeout: 10000 });
	});
});
