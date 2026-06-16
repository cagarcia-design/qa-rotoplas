// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuración del proyecto autónomo de pruebas de humo B2C (qarotoplasmx.io).
 *
 * Cómo usar:
 *   npm run dashboard           → Panel web local en http://127.0.0.1:4599
 *   npm run check:b2c           → Todo (health + contracts, ~1 min)
 *   npm run check:b2c:anon      → Solo checks que NO requieren login
 *   npm run report              → Reporte HTML del último run
 *
 * Apuntar a otro ambiente:
 *   B2C_BASE_URL=https://rotoplasmx.com npm run check:b2c
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  projects: [
    {
      name: 'b2c-contracts',
      testMatch: ['**/*.spec.js'],
      retries: 2,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        baseURL: process.env.B2C_BASE_URL || 'https://qarotoplasmx.io',
        storageState: undefined,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'on-first-retry',
      },
    },
  ],
  outputDir: 'test-results',
});
