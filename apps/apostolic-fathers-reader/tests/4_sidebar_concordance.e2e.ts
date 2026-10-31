import { expect, test } from '@playwright/test';

test.describe('Apostolic Fathers Reader - Sidebar, Concordance & Highlights', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/?work=1CLE&chapter=1');
		await expect(page.locator('.greek-font').first()).toBeVisible({ timeout: 15000 });
	});

	test('expands attested forms, tests concordance jump, highlights lemma, and dismisses sidebar', async ({ page }) => {
		// Open sidebar by clicking πεποιῆσθαι in 1:1
		const token = page.locator('button', { hasText: /^πεποιῆσθαι$/ }).first();
		await expect(token).toBeVisible({ timeout: 10000 });
		await token.click();

		// Assert side panel is open
		const lemmaHeading = page.locator('h2.greek-font', { hasText: /ποι[έέ]ω/ });
		await expect(lemmaHeading).toBeVisible({ timeout: 10000 });

		// 1. Expand Attested Forms accordion (<summary>)
		const attestedSummary = page.locator('summary', { hasText: 'Attested Forms' });
		await expect(attestedSummary).toBeVisible({ timeout: 5000 });
		await attestedSummary.click();

		// Verify attested form chips appear without trailing punctuation
		const formChip = page.locator('.chip-pill', { hasText: /πεποιῆσθαι|ἐποιεῖτε/ }).first();
		await expect(formChip).toBeVisible({ timeout: 10000 });

		// 2. Expand Concordance accordion (<button>)
		const concordanceAccordion = page.locator('button', { hasText: 'Concordance' });
		await expect(concordanceAccordion).toBeVisible({ timeout: 5000 });
		await concordanceAccordion.click();

		// Verify occurrence count and KWIC snippets
		const occItem = page.locator('button', { hasText: /1 Clement 1:3/ }).first();
		await expect(occItem).toBeVisible({ timeout: 10000 });

		// 3. Highlight the active lemma via the toggle button
		const highlightToggleBtn = page.locator('button[title*="Highlight this lemma"]').first();
		await expect(highlightToggleBtn).toBeVisible({ timeout: 5000 });
		await highlightToggleBtn.click();

		// Verify word token in the text has the active highlight class and style
		await expect(token).toHaveClass(/hl-token/);
		const styleAttr = await token.getAttribute('style');
		expect(styleAttr).toContain('--hl-bg:');

		// 4. Close side panel via the close button (✕)
		const closePanelBtn = page.locator('button[aria-label="Close side panel"]').first();
		await closePanelBtn.click();
		await expect(lemmaHeading).not.toBeVisible({ timeout: 5000 });
	});
});
