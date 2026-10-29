import { expect, test } from '@playwright/test';

test.describe('LSJ Lexicon integration in PBV', () => {
	test('clicking on ἐποίησεν in LXX Gen 1:1 opens LSJ panel and displays definition for ποιέω', async ({ page }) => {
		// Navigate to the PBV landing page (defaults to Gen 1 with BHS and LXX columns)
		await page.goto('/');

		// Wait for the verses and words to load, targeting Gen 1:1
		const epoiesenWord = page.locator('#verse-1').locator('span[aria-label="Lexeme info"]', { hasText: 'ἐποίησεν' });
		await expect(epoiesenWord).toBeVisible({ timeout: 15000 });

		// Click on the Greek word ἐποίησεν to open the Lemma Info modal
		await epoiesenWord.click();

		// Verify the lemma modal header shows the lemma ποιέω
		const modalHeader = page.locator('h1', { hasText: 'ποιέω' });
		await expect(modalHeader).toBeVisible({ timeout: 10000 });

		// Locate and click the LSJ accordion to open it
		const lsjSummary = page.locator('details summary', { hasText: 'Liddell-Scott-Jones Lexicon' });
		await expect(lsjSummary).toBeVisible();
		await lsjSummary.click();

		// Verify the LSJ definition container contains the expected text
		const lsjText = page.locator('.lsj-text');
		await expect(lsjText).toBeVisible({ timeout: 10000 });
		await expect(lsjText).toContainText('first of something material, as manufactures');
	});
});
