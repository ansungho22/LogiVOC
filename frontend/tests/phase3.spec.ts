import { test, expect } from '@playwright/test';

test.describe('Phase 3 Routing & Ontology CRUD', () => {
  test('should navigate between Workspaces, Data Registration, and Admin', async ({ page }) => {
    // 1. Visit root, should show Workspace (or click Workspace)
    await page.goto('/');
    
    // Check if we are on Workspace
    await expect(page.locator('text=Your Workspaces').first()).toBeVisible();

    // 2. Click Data Registration
    await page.click('a[href="/data-registration"]');
    await expect(page).toHaveURL(/.*\/data-registration/);
    await expect(page.locator('text=Upload Document').first()).toBeVisible();

    // 3. Click Admin
    await page.click('a[href="/system-admin"]');
    await expect(page).toHaveURL(/.*\/system-admin/);
    await expect(page.locator('text=Data & Knowledge Management').first()).toBeVisible();
  });

  test('should perform CRUD operations on Ontology (Category) in System Admin', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await page.goto('/system-admin');
    
    // Wait for the page to load (Dashboard or Data by default)
    await expect(page.locator('text=Data & Knowledge Management').first()).toBeVisible();

    // Click Categories tab in left nav
    await page.click('button:has-text("Categories")');
    await expect(page.locator('text=Category Management').first()).toBeVisible();

    // Create a unique category name to avoid conflicts
    const categoryName = `E2E Test Category ${Date.now()}`;
    const updatedCategoryName = `${categoryName} (Updated)`;

    // CREATE
    await page.click('button:has-text("New Category")', { force: true });
    await expect(page.locator('text=New Category').nth(1)).toBeVisible(); // Drawer title

    // Fill form
    await page.fill('input[placeholder="e.g. Frontend Architecture"]', categoryName);
    await page.fill('textarea[placeholder="Describe what kind of documents belong here..."]', 'This is a test category created by E2E test.');
    await page.click('button:has-text("Save Category")', { force: true });

    // Wait for modal to disappear or category to appear in list
    await page.waitForTimeout(500);

    // Verify it exists in the list
    await expect(page.locator(`text=${categoryName}`).first()).toBeVisible();

    // EDIT
    // Find the category block, then click Edit
    const categoryBlock = page.locator('div.bg-slate-950\\/50', { hasText: categoryName });
    await categoryBlock.locator('button', { has: page.locator('svg') }).nth(0).click({ force: true });
    
    await expect(page.locator('text=Edit Category')).toBeVisible();
    await page.fill('input[placeholder="e.g. Frontend Architecture"]', updatedCategoryName);
    await page.click('button:has-text("Save Category")', { force: true });

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
