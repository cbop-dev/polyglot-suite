import { test, expect } from '@playwright/test';

test.describe('Josephus Reader - Text Loading & Lexicon Lookup', () => {
	test('loads Antiquities Book 1 with parallel Greek and English text', async ({ page }) => {
		await page.goto('/Antiquities/book/1/');

		// Verify page title and header
		await expect(page).toHaveTitle(/Antiquities/i);
		const header = page.locator('.page-header');
		await expect(header).toBeVisible();

		// Verify first section badge and Greek text
		const firstSection = page.locator('.section-row').first();
		await expect(firstSection).toBeVisible();
		await expect(firstSection.locator('.section-badge')).toContainText('§ 1–4');

		// Verify Greek text contains expected preface opening
		const greekCol = firstSection.locator('.greek-col');
		await expect(greekCol).toBeVisible();
		await expect(greekCol).toContainText('Τοῖς τὰς ἱστορίας συγγράφειν βουλομένοις');

		// Verify English translation contains Whiston text
		const englishCol = firstSection.locator('.english-col');
		await expect(englishCol).toBeVisible();
		await expect(englishCol).toContainText('Those who undertake to write histories');
	});

	test('clicking a Greek token loads morphological parsing and LSJ definition', async ({ page }) => {
		await page.goto('/Antiquities/book/1/');

		// Find word token for ποιεῖσθαι (form of ποιέω) in Antiquities 1 § 18-26
		const wordToken = page.locator('.greek-word:text("ποιεῖσθαι")').first();
		await wordToken.scrollIntoViewIfNeeded();
		await expect(wordToken).toBeVisible();

		// Click the word to trigger lemma lookup
		await wordToken.click();

		// Verify the lemma dialog opens
		const modal = page.locator('.lemma-card, [role="dialog"][aria-label*="Lemma"]').first();
		await expect(modal).toBeVisible({ timeout: 15000 });

		// Verify the Lemma Info tab or header displays the lemma ποιέω
		await expect(modal).toContainText(/ποιέω|ποιεω/i, { timeout: 15000 });

		// Verify gloss in header
		await expect(modal).toContainText(/make,\s*do/i, { timeout: 15000 });

		// Verify LSJ accordion is collapsed by default in Josephus Reader
		const dictDef = page.locator('.dict-def');
		await expect(dictDef).toBeHidden();

		// Clicking LSJ accordion expands the full definition
		const lsjToggle = page.locator('button', { hasText: /LSJ Full Definition|LSJ Lexicon Article/ }).first();
		await lsjToggle.click();
		await expect(dictDef).toBeVisible({ timeout: 10000 });

		// Close modal
		await page.keyboard.press('Escape');
		await expect(modal).toBeHidden();
	});
});
