import { expect, test } from '@playwright/test';

test.describe('Philo Reader - Sidebar, Concordance & Highlights', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/?work=OPIF&chapter=1&section=2');
		await expect(page.locator('.greek-font').first()).toBeVisible({ timeout: 15000 });
	});

	test('expands attested forms, tests concordance jump, highlights lemma, and dismisses sidebar', async ({ page }) => {
		test.setTimeout(80000);
		// Open sidebar by clicking ἐποιήσατο in § 2
		const token = page.locator('button', { hasText: /^ἐποιήσατο$/ }).first();
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
		const formChip = page.locator('.chip-pill', { hasText: /ἐποιήσατο|πεποιηκότι/ }).first();
		await expect(formChip).toBeVisible({ timeout: 35000 });

		// 2. Expand Concordance accordion (<button>)
		const concordanceAccordion = page.locator('button', { hasText: 'Concordance' });
		await expect(concordanceAccordion).toBeVisible({ timeout: 5000 });
		await concordanceAccordion.click();

		// Verify occurrence items
		const occItem = page.locator('button', { hasText: /Opif\. 11/ }).first();
		await expect(occItem).toBeVisible({ timeout: 30000 });

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
