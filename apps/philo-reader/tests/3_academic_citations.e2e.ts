import { expect, test } from '@playwright/test';

test.describe('Philo Reader - Academic Citations', () => {
	test.beforeEach(async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:4182' });
		await page.goto('/?work=OPIF&chapter=1&section=2');
		await expect(page.locator('.greek-font').first()).toBeVisible({ timeout: 15000 });
	});

	test('opens CitationModal, verifies styles, switches edition tabs, and copies citation', async ({ page }) => {

		// Click section citation badge for § 2
		const citeBtn = page.locator('button[title*="Cite section Opif. 2"]').first();
		await expect(citeBtn).toBeVisible({ timeout: 10000 });
		await citeBtn.click();

		// 1. Assert modal dialog header and locus
		const modalHeading = page.locator('h2', { hasText: 'Academic Citation' });
		await expect(modalHeading).toBeVisible({ timeout: 5000 });
		await expect(modalHeading).toContainText('Opif. 2');

		// 2. Assert scholarly style cards
		await expect(page.locator('text=SBL Handbook of Style')).toBeVisible();
		await expect(page.locator('text=Chicago Manual of Style')).toBeVisible();
		await expect(page.locator('text=MLA Style')).toBeVisible();
		await expect(page.locator('text=BibTeX')).toBeVisible();

		// 3. Switch to English Translation edition tab
		const engTab = page.locator('button', { hasText: 'English Translation' });
		await expect(engTab).toBeVisible();
		await engTab.click();

		// Verify citation text updates to English metadata (Yonge 1854)
		const citationText = page.locator('div.font-mono, div.font-serif').first();
		await expect(citationText).toContainText('Yonge');

		// 4. Click copy button inside the citation modal
		await page.bringToFront();
		const copyBtn = page.locator('button', { hasText: 'Copy' }).first();
		await expect(copyBtn).toBeVisible();
		await copyBtn.click();

		// Assert copy button changes state to Copied!
		const copiedBtn = page.locator('button.bg-emerald-600');
		await expect(copiedBtn).toBeVisible({ timeout: 5000 });
		await expect(copiedBtn).toContainText('Copied');

		// 5. Close modal
		const closeBtn = page.locator('button[aria-label="Close"]').first();
		await closeBtn.click();
		await expect(modalHeading).not.toBeVisible({ timeout: 5000 });
	});
});
