import { expect, test } from '@playwright/test';

test('clicking on Gen, submitting, and text filtering', async({page})=> {
	await page.goto('/lxx');
	await page.getByRole('button').getByText('Select Books').click();
	await page.getByRole('button').getByText('Gen').first().click();
//	await page.getByRole('button').getByText('Gen').click();
	await page.getByRole('button').getByText('Find All Lexemes!').click();
	await page.waitForSelector('#lexeme-results');
	let count = await page.locator('#lexeme-results').locator('button.greek').count();
	//console.debug("the greek button count for Gen = " + count)
	await page.getByRole('button').getByText("Results Filters ☰").first().click();
	await page.getByRole('button').getByText('Textual filter').first().click();
	await page.getByLabel('Input').fill('ιος');
	count = await page.locator('#lexeme-results').locator('button.greek').count();
	expect(count).toBe(58);
	
});


