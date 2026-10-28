import { expect, test } from '@playwright/test';


test('submitting Gen 1 and sorting', async({page})=> {
	await page.goto('/lxx');
	await page.getByRole('button').getByText('Select Chapters').first().click();
	await page.getByRole('button').getByText('Gen').first().click();
	await page.waitForSelector('dialog[open] .modal-box');
	let count = await page.locator('dialog[open] .modal-box button').count();
	expect(count).toBeGreaterThan(49);
	
	await page.locator('dialog[open] .modal-box button').getByText('1', { exact: true }).click();
	await page.locator('dialog[open] .modal-box').getByRole('button', { name: 'Close' }).first().click();
	await page.getByRole('button').getByText('Find All Lexemes!').click();

	await page.getByRole('button').getByText("Results Filters ☰").first().click();
	await page.getByRole('button').getByText('View Options').first().click();
	await page.locator('select[name="sortBy"]').selectOption({ label: 'Frequency ratio!' });
	
	await page.locator('dialog[open] .modal-box').getByRole('button', { name: 'Close' }).first().click();
    
	await page.waitForSelector('#lexeme-results');
	await expect(page.locator("#lexeme-results").locator('button').first()).toHaveText(/ἀνάγνωσις/);
	await expect(page.locator("#lexeme-results").locator('button').nth(1)).toHaveText(/ἑρμηνεία/);	
	//expect(await page.locator("#lexeme-results").locator('button').count()).toBe(114);
	//karpimos.waitFor();
	//expect(karpimos).toBeDefined;
	//karpimos.click();
	//console.debug("karpimos: " + karpimos.innerText());
	//expect(karpimos).toHaveText("κάρπιμος");
    
});