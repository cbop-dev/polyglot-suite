import { expect, test } from '@playwright/test';

test('clicking on Wis, filtering to restrict to content words, submitting, and sorting by section freq', async({page})=> {
	await page.goto('/lxx');
	await page.getByRole('button').getByText('Select Books').click();
	await page.getByRole('button').getByText('Wis').first().click();
	await page.getByRole('button').getByText('Filter Options').click();
	await page.getByRole('button').getByText('Parts of Speech').click();
	await page.getByLabel('groupSelect').nth(0).selectOption({index:0});
	await page.getByRole('button').getByText('Restrict to').click();
	await page.getByRole('button').getByText('✕').nth(1).click();
	await page.getByRole('button').getByText('✕').nth(0).click();
	await page.getByRole('button').getByText('Find All Lexemes!').click();
	await page.waitForSelector('#lexeme-results');
	await page.getByRole('button').getByText("Results Filters ☰").first().click();
	await page.getByRole('button').getByText('Textual filter').click();
	await page.getByLabel('Input').fill('σοφια');
	await page.waitForSelector('#lexeme-results');
	const wisdomButton = page.locator('#lexeme-results').locator('button.greek');
	await wisdomButton.waitFor('visible');
	
	expect(wisdomButton).toBeDefined();
	expect(wisdomButton).toHaveText('σοφία');
	await wisdomButton.click();
	
	const refButton = page.locator('dialog.modal[open] button').nth(2);
	await refButton.waitFor('visible');
	await refButton.click();
	const refHead = page.locator('.modal[open] .modal-box').locator('h2',{hasText: '254'});
	await refHead.waitFor('visible');
	expect(refHead).toBeDefined();



	//wisdomButton.
	
	/*await page.locator('#lexeme-results').locator('button').first().click();
	count = page.locator(".modal-open .modal-box .items-center").filter({ hasText: "wisdom" }).count();
	expect(count).toBe(1);*/
	
	//console.debug("the greek button count for Gen = " + count)
	//await page.getByRole('button').getByText('Textual filter').first().click();
	
	//count = await page.locator('#lexeme-results').locator('button').count();
	//expect(count).toBe(63);
	
});
