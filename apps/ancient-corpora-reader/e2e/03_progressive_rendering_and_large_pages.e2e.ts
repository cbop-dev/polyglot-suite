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

	test('handles direct target section navigation without blank frame and aligns in viewport', async ({ page }) => {
		await page.goto('/philo/OPIF/1#section-50');

		// Wait for data load
		await expect(page.locator('.section-row').first()).toBeVisible({ timeout: 15000 });

		// Section 50 should be rendered in the document and visible in viewport
		const sec50 = page.locator('#section-50, [data-section="50"]');
		await expect(sec50).toBeAttached({ timeout: 10000 });
		await expect(sec50).toBeVisible({ timeout: 5000 });

		// Check vertical position below sticky header
		const box = await sec50.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.y).toBeGreaterThanOrEqual(40);
		expect(box!.y).toBeLessThan(350);
	});

	test('in-page jump modal scrolls directly to distant section on first attempt', async ({ page }) => {
		await page.goto('/philo/OPIF/1');
		await expect(page.locator('.section-row').first()).toBeVisible({ timeout: 15000 });

		// Trigger Jump selector with hotkey 'j'
		await page.keyboard.press('j');

		// Input section 60 into the modal input and submit
		const input = page.locator('input[placeholder*="Jump to"]');
		await expect(input).toBeVisible({ timeout: 5000 });
		await input.fill('60');
		await input.press('Enter');

		// Section 60 must be in viewport on the first jump attempt
		const sec60 = page.locator('#section-60, [data-section="60"]');
		await expect(sec60).toBeAttached({ timeout: 10000 });
		await expect(sec60).toBeVisible({ timeout: 5000 });

		const box = await sec60.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.y).toBeGreaterThanOrEqual(40);
		expect(box!.y).toBeLessThan(350);
	});
});
