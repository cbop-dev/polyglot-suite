import { expect, test } from '@playwright/test';

test.describe('Attested Forms Punctuation Stripping in PBV', () => {
	test('OGNT Matt 5:2 clicking λέγων strips punctuation in Attested Forms', async ({ page }) => {
		// Navigate to Matt 5 with OGNT version in PBV
		await page.goto('/?version=OGNT&chapter=5&book=Matt&grid=OGNT&verse=2&meditate=0');

		// Locate verse 2 word 'λέγων' (in source text, OGNT has trailing ano teleia 'λέγων·')
		const legonWord = page.locator('#verse-2').locator('span[aria-label="Lexeme info"]', { hasText: 'λέγων' }).first();
		await expect(legonWord).toBeVisible({ timeout: 20000 });

		// Click the word to open Lemma Info panel
		await legonWord.click();

		// Verify Lemma modal displays λέγω
		const lemmaHeader = page.locator('h1', { hasText: 'λέγω' });
		await expect(lemmaHeader).toBeVisible({ timeout: 10000 });

		// Locate and expand the Attested Forms accordion
		const attestedSummary = page.locator('summary', { hasText: 'Attested Forms' });
		await expect(attestedSummary).toBeVisible({ timeout: 10000 });
		await attestedSummary.click();

		// Wait for chips to render
		const chipElements = page.locator('.chip-pill .chip-text');
		await expect(chipElements.first()).toBeVisible({ timeout: 15000 });

		const allChipTexts = await chipElements.allInnerTexts();
		expect(allChipTexts.length).toBeGreaterThan(0);

		// Assert clean form 'λέγων' is present
		expect(allChipTexts).toContain('λέγων');

		// Assert no forms contain trailing punctuation (Ano Teleia, Middle Dot, Question Mark, Semicolon, Dashes)
		for (const chip of allChipTexts) {
			expect(chip).not.toMatch(/[··;;—–,.!?]$/);
			expect(chip).not.toBe('λέγων·');
			expect(chip).not.toBe('λέγων·');
			expect(chip).not.toBe('ἔλεγον·');
			expect(chip).not.toBe('ἔλεγον·');
		}
	});

	test('SBLGNT Matt 5:2 clicking λέγων strips punctuation in Attested Forms', async ({ page }) => {
		// Navigate to Matt 5 with SBLGNT version in PBV
		await page.goto('/?version=SBLGNT&chapter=5&book=Matt&grid=SBLGNT&verse=2&meditate=0');

		// Locate verse 2 word 'λέγων'
		const legonWord = page.locator('#verse-2').locator('span[aria-label="Lexeme info"]', { hasText: 'λέγων' }).first();
		await expect(legonWord).toBeVisible({ timeout: 20000 });

		// Click the word to open Lemma Info panel
		await legonWord.click();

		// Verify Lemma modal displays λέγω
		const lemmaHeader = page.locator('h1', { hasText: 'λέγω' });
		await expect(lemmaHeader).toBeVisible({ timeout: 10000 });

		// Locate and expand the Attested Forms accordion
		const attestedSummary = page.locator('summary', { hasText: 'Attested Forms' });
		await expect(attestedSummary).toBeVisible({ timeout: 10000 });
		await attestedSummary.click();

		// Wait for chips to render
		const chipElements = page.locator('.chip-pill .chip-text');
		await expect(chipElements.first()).toBeVisible({ timeout: 15000 });

		const allChipTexts = await chipElements.allInnerTexts();
		expect(allChipTexts.length).toBeGreaterThan(0);

		// Assert clean form 'λέγων' is present
		expect(allChipTexts).toContain('λέγων');

		// Assert no forms contain trailing punctuation
		for (const chip of allChipTexts) {
			expect(chip).not.toMatch(/[··;;—–,.!?]$/);
			expect(chip).not.toBe('λέγων·');
			expect(chip).not.toBe('λέγων·');
			expect(chip).not.toBe('ἔλεγον·');
			expect(chip).not.toBe('ἔλεγον·');
		}
	});
});
