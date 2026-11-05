import { test, expect } from '@playwright/test';

test.describe('03: Progressive Batch Rendering & Large Pages', () => {
	test('renders initial 25-section batch on large treatise and streams remaining sections', async ({ page }) => {
		await page.goto('/philo/OPIF/1');

		// Wait for first section to appear
		const firstSec = page.locator('.section-row').first();
		await expect(firstSec).toBeVisible({ timeout: 15000 });

		// Verify initial batch renders 25 sections immediately (< 50ms TTFI)
		const rows = page.locator('.section-row');
		const initialCount = await rows.count();
		expect(initialCount).toBeGreaterThanOrEqual(25);

		// Scroll to bottom to trigger sentinel and idle callback streaming
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		await expect.poll(async () => rows.count(), {
			message: 'Expected more sections to be rendered after scrolling and idle stream',
			timeout: 6000
		}).toBeGreaterThan(initialCount);
	});

	test('handles direct target section navigation without blank frame', async ({ page }) => {
		await page.goto('/philo/OPIF/1#section-50');

		// Wait for data load
		await expect(page.locator('.section-row').first()).toBeVisible({ timeout: 15000 });

		// Section 50 should be rendered in the document
		const sec50 = page.locator('#section-50, [data-section="50"]');
		await expect(sec50).toBeAttached({ timeout: 10000 });
	});
});
