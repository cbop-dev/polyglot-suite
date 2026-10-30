import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: { command: 'npm run preview', port: 4173, timeout: 60000, reuseExistingServer: !process.env.CI },
	testDir: 'tests',
	testMatch: '**/*.{ts,js}'
});
