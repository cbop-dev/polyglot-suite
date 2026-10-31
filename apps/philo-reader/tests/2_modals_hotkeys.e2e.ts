import { expect, test } from '@playwright/test';

test.describe('Philo Reader - Modals & Hotkeys', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to root (defaults to OPIF)
		await page.goto('/');
		await expect(page.locator('.greek-font').first()).toBeVisible({ timeout: 15000 });
	});

	test('? hotkey opens and Escape closes HotkeyHelpModal', async ({ page }) => {
		await page.keyboard.press('?');

		const modalTitle = page.locator('h2', { hasText: 'Philo Reader Shortcuts' });
		await expect(modalTitle).toBeVisible({ timeout: 5000 });

		await expect(page.locator('h3', { hasText: 'Navigation' })).toBeVisible();
		await expect(page.locator('h3', { hasText: 'View' })).toBeVisible();
		await expect(page.locator('h3', { hasText: 'General' })).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(modalTitle).not.toBeVisible({ timeout: 5000 });
	});

	test('b hotkey opens BookModal, searches for Moses, and navigates', async ({ page }) => {
		await page.keyboard.press('b');

		const searchInput = page.locator('input[placeholder*="Filter Philo"]');
		await expect(searchInput).toBeVisible({ timeout: 5000 });

		await searchInput.fill('Moses');

		const mosesOption = page.locator('button', { hasText: /Life of Moses/ }).first();
		await expect(mosesOption).toBeVisible({ timeout: 5000 });
		await mosesOption.click();

		await expect(page.locator('header')).toContainText('Mos.');
	});

	test('c hotkey opens ChapterModal, selects quick section jump', async ({ page }) => {
		await page.keyboard.press('c');

		const sectionInput = page.locator('input[placeholder*="Jump to section"]');
		await expect(sectionInput).toBeVisible({ timeout: 5000 });

		// Click on § 10 button inside modal
		const sec10Btn = page.locator('.relative.z-10 button', { hasText: '§ 10' }).first();
		await expect(sec10Btn).toBeVisible({ timeout: 5000 });
		await sec10Btn.click();

		// Assert section 10 is visible
		await expect(page.locator('#section-10')).toBeVisible({ timeout: 10000 });
	});

	test('Cmd+K opens CommandPalette, searches locus, and jumps', async ({ page }) => {
		await page.keyboard.press('ControlOrMeta+k');

		const paletteInput = page.locator('input[placeholder*="Jump to treatise or section"]');
		await expect(paletteInput).toBeVisible({ timeout: 5000 });

		await paletteInput.fill('Opif 10');

		const resultItem = page.locator('button', { hasText: /Creation.*§ 10/ }).first();
		await expect(resultItem).toBeVisible({ timeout: 5000 });
		await page.keyboard.press('Enter');

		await expect(page.locator('#section-10')).toBeVisible({ timeout: 10000 });
	});
});
