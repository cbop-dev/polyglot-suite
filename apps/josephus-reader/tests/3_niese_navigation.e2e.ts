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
});
