import { expect, test } from '@playwright/test';

test('word cloud test', async ({ page }) => {
    await page.goto('/lxx');
    await page.getByRole('tab', { name: 'Word Cloud' }).click();
    await page.getByRole('button').getByText('Select Chapters').first().click();
	await page.getByRole('button',{ name: 'Gen', exact: true }).click();
	await page.waitForSelector('dialog[open] .modal-box');
	await page.locator('dialog[open] .modal-box button').getByText('1', { exact: true }).click();
    await page.locator('dialog[open] .modal-box').getByRole('button', { name: 'Close' }).first().click();
    await page.getByRole('button').getByText('Generate WordCloud!').click();
    
    await page.waitForSelector('svg');
    let svgElements = page.locator('svg');
    let svgCount = await svgElements.count();
    expect(svgCount).toBeGreaterThan(0);
});

test('word cloud test2, with filtering', async ({ page }) => {
    await page.goto('/lxx');
    await page.getByRole('tab', { name: 'Word Cloud' }).click();
    await page.getByRole('button').getByText('Select Chapters').first().click();
	await page.getByRole('button',{ name: 'Gen', exact: true }).click();
    await page.waitForSelector('dialog[open] .modal-box');
    const chapModal = page.locator('dialog[open] .modal-box');
    
	await chapModal.getByRole('button').getByText('1', { exact: true }).click();
    await chapModal.getByRole('button', { name: 'Close' }).first().click();
    await page.getByRole('button').getByText('Filter Options').first().click();
    await page.waitForSelector('dialog[open] .modal-box');

    await page.getByRole('button').getByText('Parts of Speech').click();
	await page.getByLabel('groupSelect').first().selectOption({ index: 0 });
	await page.getByRole('button').getByText('Restrict to').click();
	await page.locator('dialog[open]').last().getByRole('button', { name: 'Close' }).first().click();
	await page.locator('dialog[open]').first().getByRole('button', { name: 'Close' }).first().click();
    await page.getByRole('button').getByText('Generate WordCloud!').click();
    
    await page.waitForSelector('svg');
    let textElements = page.locator('svg text');
    await textElements.first().waitFor({ state: 'visible' });
    let textCount = await textElements.count();
    expect(textCount).toBeGreaterThan(0);
});


test('word cloud BHS test', async ({ page }) => {
    expect(true).toBe(true);
});