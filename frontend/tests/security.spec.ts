import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe.skip('Security Controls in Workspace', () => {
  test.beforeEach(async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
  });

  test('should block upload if custom prompt exceeds 500 chars', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await page.goto('/');
    await page.click('a[href="/data-registration"]');
    await expect(page.getByTestId('upload-zone')).toBeVisible({ timeout: 10000 });

    // Fill custom prompt with 501 characters
    const longPrompt = 'A'.repeat(501);
    const textarea = page.locator('textarea[placeholder*="추출하고 요약해줘"]');
    await textarea.fill(longPrompt);

    // Try to upload
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Browse Files').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.resolve('package.json'));

    // Check if error is displayed
    const errorMessage = page.locator('text=업로드 실패 (에러 코드: 400)');
    await expect(errorMessage).toBeVisible();
  });

  test('should block upload if file exceeds 5MB', async ({ page }) => {
    // Navigate directly to Data Registration tab
    await page.goto('/data-registration');
    await expect(page.getByTestId('upload-zone')).toBeVisible();

    // Try to upload a large file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Browse Files').click();
    const fileChooser = await fileChooserPromise;
    
    // Create a dummy 6MB file
    const largeFilePath = path.resolve('large_test_file.txt');
    if (!fs.existsSync(largeFilePath)) {
      fs.writeFileSync(largeFilePath, Buffer.alloc(6 * 1024 * 1024, 'A'));
    }

    await fileChooser.setFiles(largeFilePath);

    // Check if error is displayed
    const errorMessage = page.locator('text=파일 크기가 5MB를 초과했습니다.');
    await expect(errorMessage).toBeVisible();

    // Cleanup
    fs.unlinkSync(largeFilePath);
  });
});
