import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Workspace AI Pipeline Workflow', () => {
  // Handle alerts globally
  test.beforeEach(async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
  });

  test('should upload document, receive DRAFT, and verify publish action', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    // 1. Visit Data Registration
    await page.goto('/data-registration');
    
    // Check if we are on Data Registration tab
    await expect(page.getByTestId('tab-data-registration')).toBeVisible();

    // 2. Click upload button and select a file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Browse Files').click();
    const fileChooser = await fileChooserPromise;
    
    // Use an existing small file in the project for testing
    await fileChooser.setFiles(path.resolve('package.json'));

    // Wait for the upload loader to appear and then disappear
    await expect(page.locator('text=Processing Document...')).toBeVisible();
    await expect(page.locator('text=Processing Document...')).not.toBeVisible({ timeout: 15000 });

    // 3. Check the Verification panel (auto-redirects)
    await expect(page.locator('text=Verify Extracted Data')).toBeVisible();

    // Modify the title
    const titleInput = page.locator('label', { hasText: 'Title' }).locator('..').locator('input');
    await titleInput.fill('E2E Published Knowledge');

    // 5. Click GO to publish
    await page.getByTestId('btn-go').click();

    // After publishing, the draft panel should be closed and return to idle state
    await expect(page.locator('text=Upload Document')).toBeVisible({ timeout: 5000 });
  });
});
