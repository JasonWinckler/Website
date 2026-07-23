const { test, expect } = require('@playwright/test');

const pages = [
  { path: '/', name: 'home', heading: /Jason Shadow/ },
  { path: '/affiliates/', name: 'affiliates', heading: /Jason Shadow/i },
  { path: '/exclusive/', name: 'exclusive', heading: /Shadow's Temptation/i },
];

test.describe('browser screenshot smoke checks', () => {
  for (const pageInfo of pages) {
    test(`${pageInfo.name} renders and can be screenshotted`, async ({ page }, testInfo) => {
      await page.goto(pageInfo.path);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByRole('heading', { name: pageInfo.heading }).first()).toBeVisible();
      await page.screenshot({
        path: `screenshots/${pageInfo.name}-${testInfo.project.name}.png`,
        fullPage: true,
      });
    });
  }

  test('mobile menu opens in Chromium', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile menu interaction is only checked in the mobile project');

    await page.goto('/');
    await page.getByRole('button', { name: /open menu|menü öffnen/i }).click();
    await expect(page.locator('.site-header')).toHaveClass(/is-menu-open/);
    await expect(page.locator('#mobile-site-menu')).toBeVisible();
  });
});
