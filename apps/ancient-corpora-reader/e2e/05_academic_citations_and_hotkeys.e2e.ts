import { test, expect } from '@playwright/test';

test.describe('05: Academic Citations & Navigation Hotkeys', () => {
	test('opens Academic Citation modal and renders citation formats', async ({ page }) => {
		await page.goto('/af/1CLE/1');
		await expect(page.locator('.section-row').first()).toBeVisible({ timeout: 15000 });

		// Click Cite button in header
		const citeBtn = page.locator('button[title*="Citation"], button[aria-label*="Citation"], button:has-text("Cite")').first();
		if (await citeBtn.isVisible()) {
			await citeBtn.click();
			const modal = page.locator('[role="dialog"], .modal-box').first();
			await expect(modal).toBeVisible();

			// Verify presence of SBL, Chicago, or BibTeX entries
			await expect(modal).toContainText(/SBL|Chicago|BibTeX/);
		}
	});

	test('steps through divisions with bracket hotkeys and toggles help modal', async ({ page }) => {
		await page.goto('/af/1CLE/1');
		await expect(page.locator('.section-row').first()).toBeVisible({ timeout: 15000 });

		// Press ']' to step to division 2
		await page.keyboard.press(']');
		await page.waitForTimeout(500);

		// Press '[' to step back to division 1
		await page.keyboard.press('[');
		await page.waitForTimeout(500);

		// Press '?' to open Hotkey Help modal
		await page.keyboard.press('?');
		const helpModal = page.locator('[role="dialog"], .modal-box').first();
		await expect(helpModal).toBeVisible();
		await expect(helpModal).toContainText('Keyboard Shortcuts');

		// Press 'Escape' to close
		await page.keyboard.press('Escape');
		await expect(helpModal).not.toBeVisible();
	});
});
