import { test, expect } from '@playwright/test';

const viewports = [
  { width: 375, height: 667, name: 'Mobile' },
  { width: 768, height: 1024, name: 'Tablet' },
  { width: 1440, height: 900, name: 'Desktop' },
];

for (const viewport of viewports) {
  test.describe(`${viewport.name} layout`, () => {
    test(`homepage renders correctly at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:3000'); // ajusta a tu URL local
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      // Agrega más verificaciones de layout y contenido según tu caso
    });
  });
}
