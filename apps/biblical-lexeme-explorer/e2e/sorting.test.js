import { expect, test } from '@playwright/test';
test('clicking on Gen 1 and viewing chapters', async({page})=> {
	await page.goto('/lxx');
	await page.getByRole('button').getByText('Select Chapters').first().click();
	await page.getByRole('button').getByText('Gen').click();
	await page.waitForSelector('.modal[open] .modal-box');
	let count = await page.locator('.modal[open] .modal-box button').count();
	expect(count).toBeGreaterThan(49);
	
	await page.locator('.modal[open] .modal-box button').getByText('1').first().click();
	await page.locator('.modal[open] .modal-box button').getByText('Ok').click();
	await page.getByRole('button').getByText('Find All Lexemes!').click();
	await page.waitForSelector('#lexeme-results');
	count = await page.locator('#lexeme-results').locator('button.greek').count();
	//console.debug("the greek button count for Gen 1 = " + count)
	expect(count).toBe(114);
	expect(true).toBe(true);
});

