import { expect, test } from '@playwright/test';

test.describe('Apostolic Fathers Reader - Text & LSJ Lexicon', () => {
	test('loads 1 Clement 1, verifies Greek/English text, clicks ποιέω form, verifies LSJ definition', async ({ page }) => {
		// Navigate to 1 Clement Chapter 1
		await page.goto('/?work=1CLE&chapter=1');

		// 1. Verify Greek source text is visible (1 Clement 1:1)
		const greekText = page.locator('.greek-font').first();
		await expect(greekText).toBeVisible({ timeout: 15000 });
		await expect(greekText).toContainText('Διὰ τὰς αἰφνιδίους');

		// 2. Verify facing English translation is visible (1 Clement 1:1)
		const englishText = page.locator('text=Owing to the sudden and repeated misfortunes').first();
		await expect(englishText).toBeVisible({ timeout: 10000 });

		// 3. Locate and click the attested form of ποιέω in 1 Clement 1:1: πεποιῆσθαι
		const poieoToken = page.locator('button', { hasText: /^πεποιῆσθαι$/ }).first();
		await expect(poieoToken).toBeVisible({ timeout: 10000 });
		await poieoToken.click();

		// 4. Verify Dockable Side Panel slides open, is fixed on the side, and displays the lemma headword
		const sidePanel = page.locator('aside[aria-label="Lexicon & Study Panel"]');
		await expect(sidePanel).toBeVisible({ timeout: 10000 });
		await expect(sidePanel).toHaveCSS('position', 'fixed');

		const lemmaHeading = page.locator('h2.greek-font', { hasText: /ποι[έέ]ω/ });
		await expect(lemmaHeading).toBeVisible({ timeout: 10000 });

		// 5. Verify decoded morphology badges display
		const posBadge = page.locator('span', { hasText: 'Verb' }).first();
		await expect(posBadge).toBeVisible();

		// 6. Open the LSJ Lexicon accordion
		const lsjAccordion = page.locator('button', { hasText: 'Full Lexicon Article' });
		await expect(lsjAccordion).toBeVisible({ timeout: 10000 });
		await lsjAccordion.click();

		// 7. Verify LSJ definition article displays and contains expected text
		const definitionProse = page.locator('.prose').first();
		await expect(definitionProse).toBeVisible({ timeout: 15000 });
		await expect(definitionProse).toContainText('Doric dialect');
	});
});
