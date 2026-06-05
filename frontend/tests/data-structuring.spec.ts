import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Data Structuring & Custom Prompt UAT', () => {
  test.beforeEach(async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
  });

  test('should upload CSV, structure data using custom prompt, and publish', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('/data-registration');
    await expect(page.getByTestId('tab-data-registration')).toBeVisible();

    // 1. Enter Custom Prompt
    const promptTextarea = page.locator('textarea[placeholder*="예: 이 문서에서 API 명세서 부분만"]');
    await promptTextarea.fill('이 데이터를 JSON 배열 형태나 Markdown Table 형태로 구조화해줘. 중복은 제거해줘.');

    // 2. Upload CSV
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Browse Files').click();
    const fileChooser = await fileChooserPromise;
    
    // We will use the test_data.csv we created
    await fileChooser.setFiles(path.resolve('../test_data.csv'));

    // 3. Wait for the upload loader to appear and disappear
    await expect(page.locator('text=Processing Document...')).toBeVisible();
    await expect(page.locator('text=Processing Document...')).not.toBeVisible({ timeout: 30000 });

    // 4. Check the Verification panel (auto-redirects)
    await expect(page.locator('text=Verify Extracted Data')).toBeVisible();

    // 5. Optionally, verify content contains structured data (Table or JSON)
    const textarea = page.locator('textarea').nth(1); // The second textarea is Extracted Content
    const content = await textarea.inputValue();
    console.log('Extracted Content:\n', content);

    // 6. Modify title
    const titleInput = page.locator('label', { hasText: 'Title' }).locator('..').locator('input');
    await titleInput.fill('CSV Structured Data Test');

    // 7. Publish
    await page.getByTestId('btn-go').click();

    // 8. Return to idle state
    await expect(page.locator('text=Upload Document')).toBeVisible({ timeout: 5000 });
  });
});
