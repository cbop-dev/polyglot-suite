import { expect, test } from '@playwright/test';

test.describe('Philo Reader - Text & LSJ Lexicon', () => {
	test('loads De Opificio Mundi 1:2, verifies Greek/English text, clicks ποιέω form, verifies LSJ definition', async ({ page }) => {
		// Navigate to De Opificio Mundi Section 2
		await page.goto('/?work=OPIF&chapter=1&section=2');

		// 1. Verify Greek critical text is visible
		const greekText = page.locator('.greek-font').first();
		await expect(greekText).toBeVisible({ timeout: 15000 });

		// 2. Verify facing Yonge English translation is visible (§ 2)
		const englishText = page.locator('text=But Moses, rejecting both of these methods').first();
		await expect(englishText).toBeVisible({ timeout: 10000 });

		// 3. Locate and click the attested form of ποιέω: ἐποιήσατο in § 2
		const poieoToken = page.locator('button', { hasText: /^ἐποιήσατο$/ }).first();
		await expect(poieoToken).toBeVisible({ timeout: 10000 });
		await poieoToken.click();

		// 4. Verify Dockable Side Panel slides open, is fixed on the side, and displays the lemma headword
		const sidePanel = page.locator('aside[aria-label="Philo Reference and Lexicon Panel"]');
		await expect(sidePanel).toBeVisible({ timeout: 10000 });
		await expect(sidePanel).toHaveCSS('position', 'fixed');

		const lemmaHeading = page.locator('h2.greek-font', { hasText: /ποι[έέ]ω/ });
		await expect(lemmaHeading).toBeVisible({ timeout: 10000 });

		// 5. Verify decoded morphology badges display
		const posBadge = page.locator('span', { hasText: 'Verb' }).first();
		await expect(posBadge).toBeVisible();

		// 6. Open the LSJ Lexicon accordion
		const lsjAccordion = page.locator('button', { hasText: /LSJ Greek Lexicon Entry|Full Lexicon Article/ }).first();
		await expect(lsjAccordion).toBeVisible({ timeout: 10000 });
		await lsjAccordion.click();

		// 7. Verify LSJ definition article displays and contains expected text
		const definitionProse = page.locator('.prose').first();
		await expect(definitionProse).toBeVisible({ timeout: 15000 });
		await expect(definitionProse).toContainText('Doric dialect');
	});
});
