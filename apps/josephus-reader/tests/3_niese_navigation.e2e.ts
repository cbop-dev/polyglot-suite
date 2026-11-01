import { test, expect } from '@playwright/test';

test.describe('Josephus Reader - Niese Section Navigation', () => {
	test('jumps to section via Niese quick-jump input', async ({ page }) => {
		await page.goto('/Antiquities/book/1/');

		// Target section #niese-10 (sections 10-17)
		const targetSec = page.locator('#niese-10');
		await expect(targetSec).toBeAttached();

		// Trigger Niese jump box via hotkey 'j'
		await page.keyboard.press('j');

		const jumpInput = page.locator('#niese-input, input.nj-input').first();
		await expect(jumpInput).toBeVisible();

		// Enter section 10 and press Enter
		await jumpInput.fill('10');
		await page.keyboard.press('Enter');

		// URL hash should update or section should be scrolled into view
		await expect(page).toHaveURL(/.*#niese-10/);
	});

	test('opens section modal via header section button', async ({ page }) => {
		await page.goto('/Antiquities/book/1/');

		const secBtn = page.locator('.section-picker-trigger').first();
		await expect(secBtn).toBeVisible();
		await secBtn.click();

		const jumpInput = page.locator('input.nj-input').first();
		await expect(jumpInput).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(jumpInput).toBeHidden();
	});

	test('jumps across books using compound book.section notation', async ({ page }) => {
		await page.goto('/Antiquities/book/1/');

		// Wait for page to be ready
		const secBtn = page.locator('.section-picker-trigger').first();
		await expect(secBtn).toBeVisible();

		// Open section picker modal via trigger or hotkey 'j'
		await secBtn.click();
		const jumpInput = page.locator('input.nj-input').first();
		await expect(jumpInput).toBeVisible();

		// Enter "2.5" (Book 2, section 5) and press Enter
		await jumpInput.fill('2.5');
		await page.keyboard.press('Enter');

		// URL updates to Book 2 with hash #niese-5
		await expect(page).toHaveURL(/.*\/Antiquities\/book\/2\/.*#niese-5/);
	});
});
