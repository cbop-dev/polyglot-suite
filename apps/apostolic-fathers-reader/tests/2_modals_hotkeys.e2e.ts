import { expect, test } from '@playwright/test';

test.describe('Apostolic Fathers Reader - Modals & Hotkeys', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to root (defaults to 1CLE chapter 1 without URL lock)
		await page.goto('/');
		await expect(page.locator('.greek-font').first()).toBeVisible({ timeout: 15000 });
	});

	test('? hotkey opens and Escape closes HotkeyHelpModal', async ({ page }) => {
		// Press '?' to open hotkey help
		await page.keyboard.press('?');

		// Assert modal title
		const modalTitle = page.locator('h2', { hasText: 'Keyboard Shortcuts' });
		await expect(modalTitle).toBeVisible({ timeout: 5000 });

		// Verify category headers
		await expect(page.locator('h3', { hasText: 'Navigation' })).toBeVisible();
		await expect(page.locator('h3', { hasText: 'View' })).toBeVisible();
		await expect(page.locator('h3', { hasText: 'General' })).toBeVisible();

		// Press 'Escape' to dismiss
		await page.keyboard.press('Escape');
		await expect(modalTitle).not.toBeVisible({ timeout: 5000 });
	});

	test('b hotkey opens BookModal, searches for Didache, and navigates', async ({ page }) => {
		// Press 'b' to open work selector
		await page.keyboard.press('b');

		// Verify input is visible and auto-focused
		const searchInput = page.locator('input[placeholder*="Filter works"]');
		await expect(searchInput).toBeVisible({ timeout: 5000 });

		// Type 'Didache'
		await searchInput.fill('Didache');

		// Assert Didache appears in list and click it
		const didacheOption = page.locator('button', { hasText: /Didache/ }).first();
		await expect(didacheOption).toBeVisible({ timeout: 5000 });
		await didacheOption.click();

		// Assert page updates to Didache
		await expect(page.locator('header')).toContainText('Didache');
	});

	test('c hotkey opens ChapterModal, selects a chapter, and navigates', async ({ page }) => {
		// Press 'c' to open chapter selector
		await page.keyboard.press('c');

		// Verify chapter modal is open
		const chapterInput = page.locator('input[placeholder*="Type chapter number"]');
		await expect(chapterInput).toBeVisible({ timeout: 5000 });

		// Click on Chapter 2
		const ch2Btn = page.locator('button', { hasText: 'Chapter 2' }).first();
		await expect(ch2Btn).toBeVisible({ timeout: 5000 });
		await ch2Btn.click();

		// Assert section 2:1 is visible in the view
		await expect(page.locator('text=2:1').first()).toBeVisible({ timeout: 10000 });
	});

	test('Cmd+K opens CommandPalette, searches locus, and jumps', async ({ page }) => {
		// Open command palette via hotkey
		await page.keyboard.press('ControlOrMeta+k');

		// Verify input is open
		const paletteInput = page.locator('input[placeholder*="Type a work or reference"]');
		await expect(paletteInput).toBeVisible({ timeout: 5000 });

		// Type '1 Clem 3'
		await paletteInput.fill('1 Clem 3');

		// Assert match appears and press Enter
		const resultItem = page.locator('button', { hasText: /1 Clement — Chapter 3/ }).first();
		await expect(resultItem).toBeVisible({ timeout: 5000 });
		await page.keyboard.press('Enter');

		// Assert navigation to Chapter 3
		await expect(page.locator('text=3:1').first()).toBeVisible({ timeout: 10000 });
	});
});
