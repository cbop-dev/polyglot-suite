import { expect, test } from '@playwright/test';

test.describe('Apostolic Fathers Reader - Academic Citations', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/?work=1CLE&chapter=1');
		await expect(page.locator('.greek-font').first()).toBeVisible({ timeout: 15000 });
	});

	test('opens CitationModal, verifies styles, switches edition tabs, and copies citation', async ({ page, context }) => {
		// Grant clipboard permissions
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);

		// Click the section citation badge for 1:1
		const citeBtn = page.locator('button', { hasText: /^1:1$/ }).first();
		await expect(citeBtn).toBeVisible({ timeout: 10000 });
		await citeBtn.click();

		// 1. Assert modal dialog header and locus badge
		const modalHeading = page.locator('h2', { hasText: 'Academic Citation' });
		await expect(modalHeading).toBeVisible({ timeout: 5000 });
		await expect(page.locator('text=1 Clem. 1:1').first()).toBeVisible();

		// 2. Assert scholarly style cards are rendered
		await expect(page.locator('text=SBL Handbook of Style')).toBeVisible();
		await expect(page.locator('text=Chicago Manual of Style')).toBeVisible();
		await expect(page.locator('text=MLA Style')).toBeVisible();
		await expect(page.locator('text=BibTeX')).toBeVisible();

		// 3. Switch to English Translation edition tab
		const engTab = page.locator('button', { hasText: 'English Translation' });
		await expect(engTab).toBeVisible();
		await engTab.click();

		// Verify citation text updates to English metadata (trans. Lake)
		const citationText = page.locator('div.font-mono, div.font-serif').first();
		await expect(citationText).toContainText('trans. Lake');

		// 4. Click copy button on the first style
		const copyBtn = page.locator('button', { hasText: 'Copy' }).first();
		await expect(copyBtn).toBeVisible();
		await copyBtn.click();

		// Assert copy button changes state to Copied!
		await expect(page.locator('button', { hasText: 'Copied!' })).toBeVisible({ timeout: 5000 });

		// 5. Close modal with close button
		const closeBtn = page.locator('button[aria-label="Close"]').first();
		await closeBtn.click();
		await expect(modalHeading).not.toBeVisible({ timeout: 5000 });
	});
});
