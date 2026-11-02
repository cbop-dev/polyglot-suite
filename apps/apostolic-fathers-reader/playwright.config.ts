import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	testMatch: '**/*.e2e.ts',
	timeout: 30000,
	expect: {
		timeout: 10000
	},
	fullyParallel: false,
	workers: 1,
	use: {
		baseURL: 'http://localhost:4181',
		trace: 'on-first-retry',
		headless: true
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: 'npm run preview:www -- --port 4181',
		port: 4181,
		timeout: 60000,
		reuseExistingServer: !process.env.CI
	}
});
