import { test, expect } from '@playwright/test';

test.describe('Phase 3 Routing & Ontology CRUD', () => {
  test('should navigate between Workspaces, Data Registration, and Admin', async ({ page }) => {
    // 1. Visit root, should show Workspace (or click Workspace)
    await page.goto('/');
    
    // Check if we are on Workspace
    await expect(page.locator('text=통합 문서 검색').first()).toBeVisible();

    // 2. Click Data Registration
    await page.click('a[href="/data-registration"]');
    await expect(page).toHaveURL(/.*\/data-registration/);
    await expect(page.locator('text=Upload Document').first()).toBeVisible();

    // 3. Click Admin
    await page.click('a[href="/system-admin"]');
    await expect(page).toHaveURL(/.*\/system-admin/);
    await expect(page.locator('text=시스템 대시보드').first()).toBeVisible();
  });

  test('should perform CRUD operations on Ontology (Category) in System Admin', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await page.goto('/system-admin');
    
    // Wait for the page to load (Dashboard or Data by default)
    await expect(page.locator('text=시스템 대시보드').first()).toBeVisible();

    // Click Categories tab in left nav
    await page.click('button:has-text("카테고리 관리")');
    await expect(page.locator('text=카테고리 관리').first()).toBeVisible();

    // Create a unique category name to avoid conflicts
    const categoryName = `E2E Test Category ${Date.now()}`;
    const updatedCategoryName = `${categoryName} (Updated)`;

    // CREATE
    await page.click('button:has-text("새 카테고리")', { force: true });
    await expect(page.locator('text=새 카테고리').nth(1)).toBeVisible(); // Drawer title

    // Fill form
    await page.fill('input[placeholder="예: 프론트엔드 아키텍처"]', categoryName);
    await page.fill('textarea[placeholder="이 카테고리에 포함될 문서에 대해 설명하세요..."]', 'This is a test category created by E2E test.');
    await page.click('button:has-text("저장")', { force: true });

    // Wait for modal to disappear or category to appear in list
    await page.waitForTimeout(500);

    // Verify it exists in the list
    await expect(page.locator(`text=${categoryName}`).first()).toBeVisible();

    // EDIT
    // Find the category block, then click Edit
    const categoryBlock = page.locator('div.bg-slate-950\\/50', { hasText: categoryName });
    await categoryBlock.locator('button', { has: page.locator('svg') }).nth(0).click({ force: true });
    
    await expect(page.locator('text=카테고리 수정')).toBeVisible();
    await page.fill('input[placeholder="예: 프론트엔드 아키텍처"]', updatedCategoryName);
    await page.click('button:has-text("저장")', { force: true });

    await page.waitForTimeout(500);

    // Verify updated name
    await expect(page.locator(`text=${updatedCategoryName}`).first()).toBeVisible();

    // DELETE
    const updatedCategoryBlock = page.locator('div.bg-slate-950\\/50', { hasText: updatedCategoryName });
    
    // Handle the confirm dialog natively
    page.on('dialog', dialog => dialog.accept());
    
    await updatedCategoryBlock.locator('button', { has: page.locator('svg') }).nth(1).click({ force: true });
    
    await page.waitForTimeout(500);

    // Verify deletion
    await expect(page.locator(`text=${updatedCategoryName}`).first()).not.toBeVisible();
  });
});
