import { test, expect } from '@playwright/test';

test.describe('01: Parallel Reading & Lexicon Exploration', () => {
	test('loads Apostolic Fathers, displays parallel columns, and inspects lexeme', async ({ page }) => {
		await page.goto('/af');

		// Wait for sections to load from SQLite chunks
		const firstSection = page.locator('.section-row').first();
		await expect(firstSection).toBeVisible({ timeout: 15000 });

		// Verify header displays corpus name and work
		await expect(page.locator('.corpus-picker-trigger')).toContainText('Apostolic Fathers');

		// Click on a Greek word token in the text
		const wordToken = page.locator('.token-word').first();
		await expect(wordToken).toBeVisible();
		const wordText = await wordToken.innerText();
		await wordToken.click();

		// Side panel should open
		const sidePanel = page.locator('aside, .floating-side-panel, [role="complementary"]').first();
		await expect(sidePanel).toBeVisible({ timeout: 8000 });

		// Verify side panel contains active lexeme tab
		await expect(page.locator('button[title*="Close"], button[aria-label*="Close"]').first()).toBeVisible();
	});

	test('loads Josephus with Niese milestone badges', async ({ page }) => {
		await page.goto('/josephus');

		const firstSection = page.locator('.section-row').first();
		await expect(firstSection).toBeVisible({ timeout: 15000 });

		// Verify Josephus corpus name
		await expect(page.locator('.corpus-picker-trigger')).toContainText('Flavius Josephus');

		// Verify milestone badge contains section prefix
		const badge = page.locator('.section-badge').first();
		await expect(badge).toBeVisible();
		await expect(badge).toContainText('§');
	});

	test('loads Philo with Mangey milestone badges', async ({ page }) => {
		await page.goto('/philo');

		const firstSection = page.locator('.section-row').first();
		await expect(firstSection).toBeVisible({ timeout: 15000 });

		// Verify Philo corpus name
		await expect(page.locator('.corpus-picker-trigger')).toContainText('Philo of Alexandria');

		// Verify milestone badge
		const badge = page.locator('.section-badge').first();
		await expect(badge).toBeVisible();
		await expect(badge).toContainText('M.');
	});
});
