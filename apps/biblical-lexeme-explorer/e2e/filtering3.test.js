import { expect, test } from '@playwright/test';

test('clicking on Wis, filtering to restrict to content words, submitting', async({page})=> {
	await page.goto('/lxx');
	await page.getByRole('button').getByText('Select Books').click();
	await page.getByRole('button').getByText('Wis').first().click();
	await page.getByRole('button').getByText('Filter Options').click();
	await page.getByRole('button').getByText('Parts of Speech').click();
	await page.getByLabel('groupSelect').first().selectOption('CONTENT');
	await page.getByRole('button').getByText('Restrict to').click();
	await page.getByRole('button').getByText('✕').nth(1).click();
	await page.getByRole('button').getByText('✕').nth(0).click();
	await page.getByRole('button').getByText('Find All Lexemes!').click();
	await page.waitForSelector('#lexeme-results');
	let count = await page.locator('#lexeme-results').locator('button.greek').count();
	count = await page.locator('#lexeme-results').locator('button.greek').count();
	//expect(count).toBe(1674);
	expect(count).toBe(1671); //used to be 1671 before tf-fast 0.5.2. Not sure why!
});
