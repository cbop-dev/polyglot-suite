import { expect, test } from '@playwright/test';


test('submitting Gen 1 and sorting', async({page})=> {
	await page.goto('/lxx');
	await page.getByRole('button').getByText('Select Chapters').first().click();
	await page.getByRole('button').getByText('Gen').first().click();
	await page.waitForSelector('.modal[open] .modal-box');
	let count = await page.locator('.modal[open] .modal-box button').count();
	expect(count).toBeGreaterThan(49);
	
	await page.locator('.modal[open] .modal-box button').getByText('1').first().click();
	await page.locator('.modal[open] .modal-box button').getByText('Ok').click();
	await page.getByRole('button').getByText('Find All Lexemes!').click();
	

	//await page.getByRole('button').getByText('View Options').firstwaitFor();
	await page.getByRole('button').getByText("Results Filters ☰").first().click();
	await page.getByRole('button').getByText('View Options').first().click();
	await page.getByLabel("Sort by",{ exact: true }).selectOption('Frequency ratio!');
	
    const button = page.locator('.modal[open] .modal-box .modal-backdrop button');
	
	await button.click({position:{x: 2, y:2}});
    
	await page.waitForSelector('#lexeme-results');
	//const karpimos = page.locator("#lexeme-results").locator('button').first();
	await expect(page.locator("#lexeme-results").locator('button').first()).toHaveText('κয়ρπιμος')
	await expect(page.locator("#lexeme-results").locator('button').nth(1)).toHaveText('σπόριμος')	
	//expect(await page.locator("#lexeme-results").locator('button').count()).toBe(114);
	//karpimos.waitFor();
	//expect(karpimos).toBeDefined;
	//karpimos.click();
	//console.debug("karpimos: " + karpimos.innerText());
	//expect(karpimos).toHaveText("κάρπιμος");
    
});