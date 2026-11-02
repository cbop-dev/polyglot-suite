import { test, expect } from '@playwright/test';

test.describe('Josephus Reader - Modals & Hotkeys', () => {
	test('toggles keyboard shortcuts modal with "?" and closes with Escape', async ({ page }) => {
		await page.goto('/Antiquities/book/1/');

		// Help modal starts hidden
		const helpModal = page.locator('#help-modal, aside.help-modal').first();
		await expect(helpModal).toBeHidden();

		// Press '?' to open
		await page.keyboard.press('?');
		await expect(helpModal).toBeVisible();
		await expect(helpModal).toContainText('Keyboard Shortcuts');

		// Press 'Escape' to close
		await page.keyboard.press('Escape');
		await expect(helpModal).toBeHidden();
	});

	test('opens command palette and searches works', async ({ page }) => {
		await page.goto('/Antiquities/book/1/');

		const cpCard = page.locator('.cp-card, [role="dialog"][aria-label="Command Palette"]').first();
		await expect(cpCard).toBeHidden();

		// Trigger command palette via keyboard shortcut
		await page.keyboard.press('Control+k');

		await expect(cpCard).toBeVisible();

		// Type in query
		const input = cpCard.locator('input');
		await input.fill('War');

		// Verify filtered results contain War
		await expect(cpCard).toContainText('War');

		// Close with Escape
		await page.keyboard.press('Escape');
		await expect(cpCard).toBeHidden();
	});

	test('toggles bookmarks modal with "b" and closes with Escape', async ({ page }) => {
		await page.goto('/Antiquities/book/1/');

		const bmCard = page.locator('.bm-card, [role="dialog"][aria-label="Bookmarks Manager"]').first();
		await expect(bmCard).toBeHidden();

		await page.keyboard.press('b');
		await expect(bmCard).toBeVisible();
		await expect(bmCard).toContainText(/Bookmarks/i);

		await page.keyboard.press('Escape');
		await expect(bmCard).toBeHidden();
	});

	test('opens academic citation modal from section button', async ({ page }) => {
		await page.goto('/Antiquities/book/1/');

		const citeBtn = page.locator('.cite-trigger-btn').first();
		await expect(citeBtn).toBeVisible();
		await citeBtn.click();

		const citeCard = page.locator('.cite-card, [role="dialog"][aria-label="Citation Generator"]').first();
		await expect(citeCard).toBeVisible();
		await expect(citeCard).toContainText(/Citation|Antiquities/i);

		await page.keyboard.press('Escape');
		await expect(citeCard).toBeHidden();
	});

	test('toggles lemma/search side panel with "/" and closes with Escape', async ({ page }) => {
		await page.goto('/Antiquities/book/1/');

		const sidePanel = page.locator('aside.floating-side-panel').first();
		await expect(sidePanel).toBeHidden();

		// Press '/' to toggle search panel
		await page.keyboard.press('/');
		await expect(sidePanel).toBeVisible({ timeout: 10000 });

		// Verify search input is focused
		const searchInput = sidePanel.locator('#side-search-input');
		await expect(searchInput).toBeVisible();
		await expect(searchInput).toBeFocused();

		// Close with Escape
		await page.keyboard.press('Escape');
		await expect(sidePanel).toBeHidden();
	});
});
