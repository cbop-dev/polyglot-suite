import { expect, test } from '@playwright/test';

test('word cloud test', async ({ page }) => {
    await page.goto('/lxx');
    await page.locator('a').getByText('Word Cloud').click();
    await page.getByRole('button').getByText('Select Chapters').first().click();
	await page.getByRole('button',{ name: 'Gen', exact: true }).click();
	await page.waitForSelector('.modal[open] .modal-box');
	let count = await page.locator('.modal[open] .modal-box button').count();
	await page.locator('.modal[open] .modal-box button').getByText('1').first().click();
    await page.locator('.modal[open] .modal-box button').getByText('Ok').click();
    await page.getByRole('button').getByText('Generate WordCloud!').click();
    
    await page.waitForSelector('svg');
    let svgElements = await page.locator('svg');
    let svgCount = await svgElements.count();
    expect(svgCount).toBeGreaterThan(0);
    //let texts = await  page.locator('text')
    //let wordCount = await texts.count();
    //expect(wordCount).toBeGreaterThan(42);
    

});

test('word cloud test2, with filtering', async ({ page }) => {
    await page.goto('/lxx');
    await page.locator('a').getByText('Word Cloud').click();
    await page.getByRole('button').getByText('Select Chapters').first().click();
	await page.getByRole('button',{ name: 'Gen', exact: true }).click();
    await page.waitForSelector('.modal[open] .modal-box');
    const chapModal = page.locator('.modal[open] .modal-box');
    await chapModal.waitFor('visible');
    
	//let count = await page.locator('.modal[open] .modal-box').getByRole('button').count();
	await chapModal.getByRole('button').getByText('1').first().click();
    await chapModal.getByRole('button').getByText('Ok').click();
    await page.getByRole('button').getByText('Filter Options').first().click();
    await page.waitForSelector('.modal[open] .modal-box').waitFor('visible');


    await page.getByRole('button').getByText('Parts of Speech').click();
	await page.getByLabel('groupSelect').nth(0).selectOption({index:0});
	await page.getByRole('button').getByText('Restrict to').click();
	await page.getByRole('button',{ name: 'Close', exact: true }).click();
	await page.getByRole('button').getByText('Ok').nth(2).click();
    await page.getByRole('button').getByText('Generate WordCloud!').click();
    
    await page.waitForSelector('svg').waitFor('visible');
    let textElements = page.locator('svg > text');
    textElements.waitFor('visisible');
    let textCount = await textElements.count();
    expect(textCount).toEqual(95);

    
    //let texts = await  page.locator('text')
    //let wordCount = await texts.count();
    //expect(wordCount).toEqual(42);

});


test('word cloud BHS test', async ({ page }) => {
    expect(true).toBe(true);
});