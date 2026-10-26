import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1').first()).toBeVisible();
	



});

test('clicking on LXX Gen and submitting', async({page})=> {
	await page.goto('/lxx');
	await page.getByRole('button').getByText('Select Books').click();
	await page.getByRole('button').getByText('Gen').first().click();
//	await page.getByRole('button').getByText('Gen').click();
	await page.getByRole('button').getByText('Find All Lexemes!').click();
	await page.waitForSelector('#lexeme-results');
	let count = await page.locator('#lexeme-results').locator('button.greek').count();
	//console.debug("the greek button count for Gen = " + count)
	expect(count).toBe(2096);


	
});
