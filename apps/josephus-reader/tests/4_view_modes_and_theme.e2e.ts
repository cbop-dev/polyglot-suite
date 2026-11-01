import { test, expect } from '@playwright/test';

test.describe('Josephus Reader - View Modes & Themes', () => {
	test('toggles language display modes via hotkeys', async ({ page }) => {
		await page.goto('/Antiquities/book/1/');

		const greekCol = page.locator('.section-row .greek-col').first();
		const englishCol = page.locator('.section-row .english-col').first();

		// Initially both are visible in parallel view
		await expect(greekCol).toBeVisible();
		await expect(englishCol).toBeVisible();

		// Press 'g' for Greek only
		await page.keyboard.press('g');
		await expect(greekCol).toBeVisible();
		await expect(englishCol).toBeHidden();

		// Press 'e' for English only
		await page.keyboard.press('e');
		await expect(greekCol).toBeHidden();
		await expect(englishCol).toBeVisible();

		// Press 'd' for Dual (parallel/stacked)
		await page.keyboard.press('d');
		await expect(greekCol).toBeVisible();
		await expect(englishCol).toBeVisible();
	});

	test('switches layout modes via LayoutOptions dropdown', async ({ page }) => {
		await page.goto('/Antiquities/book/1/');

		const greekCol = page.locator('.section-row .greek-col').first();
		const englishCol = page.locator('.section-row .english-col').first();

		// Initially both are visible in parallel view
		await expect(greekCol).toBeVisible();
		await expect(englishCol).toBeVisible();

		// Open layout dropdown
		const layoutBtn = page.locator('.layout-options-btn').first();
		await expect(layoutBtn).toBeVisible();
		await layoutBtn.click();

		const dropdown = page.locator('.layout-dropdown-menu');
		await expect(dropdown).toBeVisible();

		// Select Greek Only
		const greekOption = dropdown.locator('button', { hasText: /Greek Only/ }).first();
		await greekOption.click();

		await expect(greekCol).toBeVisible();
		await expect(englishCol).toBeHidden();

		// Re-open and select Parallel
		await layoutBtn.click();
		await expect(dropdown).toBeVisible();
		const parallelOption = dropdown.locator('button', { hasText: /Parallel/ }).first();
		await parallelOption.click();

		await expect(greekCol).toBeVisible();
		await expect(englishCol).toBeVisible();
	});

	test('switches work treatises via the work picker modal', async ({ page }) => {
		await page.goto('/Antiquities/book/1/');

		const workBtn = page.locator('.work-picker-trigger').first();
		await expect(workBtn).toBeVisible();
		await workBtn.click();

		const searchInput = page.locator('input[placeholder*="Filter Josephus"]');
		await expect(searchInput).toBeVisible({ timeout: 5000 });

		// Click War in the list
		const warOption = page.locator('button', { hasText: /The Jewish War|War/ }).first();
		await expect(warOption).toBeVisible();
		await warOption.click();

		// URL updates to War
		await expect(page).toHaveURL(/.*\/War\/book\/1\/?/);
		await expect(page).toHaveTitle(/War/i);

		// First section of War renders
		const firstSection = page.locator('.section-row').first();
		await expect(firstSection).toBeVisible();
	});

	test('side panel has opaque background and does not obscure theme slider popup', async ({ page }) => {
		await page.goto('/Antiquities/book/1/');

		// Click a Greek word to open the side panel
		const wordToken = page.locator('.greek-word').first();
		await wordToken.click();

		const sidePanel = page.locator('aside.floating-side-panel');
		await expect(sidePanel).toBeVisible({ timeout: 10000 });

		// Verify side panel has a solid opaque background (not transparent)
		const bgCol = await sidePanel.evaluate((el) => window.getComputedStyle(el).backgroundColor);
		expect(bgCol).not.toBe('rgba(0, 0, 0, 0)');
		expect(bgCol).not.toBe('transparent');

		// Open the theme slider while side panel is open
		const themeBtn = page.locator('.theme-slider-btn').first();
		await themeBtn.click();

		const themePanel = page.locator('.theme-slider-panel');
		await expect(themePanel).toBeVisible();

		// Ensure theme slider is clickable / interactable and above side panel
		const lightBtn = themePanel.locator('button:has-text("Light")').first();
		await expect(lightBtn).toBeVisible();
		await lightBtn.click();
	});
});
