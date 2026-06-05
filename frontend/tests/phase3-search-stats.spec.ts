import { test, expect } from '@playwright/test';

test.describe('Workspace Search & Admin Stats Integration', () => {
  
  test('should allow searching documents in Workspace', async ({ page }) => {
    await page.goto('/');
    
    // Wait for Workspace to load
    await expect(page.locator('text=통합 문서 검색').first()).toBeVisible();

    // Search input
    const searchInput = page.getByPlaceholder('검색어 또는 질문을 입력하세요...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('통관');
    
    // Search button might be nearby, but let's just press Enter
    await searchInput.press('Enter');
    
    // Wait for network/UI
    await page.waitForTimeout(1000);
    
    // If search runs successfully, we should still see the search box 
    // without crashes.
    await expect(searchInput).toBeVisible();
  });

  test('should display statistics in Admin Dashboard', async ({ page }) => {
    await page.goto('/system-admin');
    
    // The default tab is 'dashboard', but let's ensure by clicking
    const dashboardTab = page.locator('button', { hasText: '대시보드' }).first();
    await dashboardTab.click();
    
    // Check headings
    await expect(page.locator('text=시스템 대시보드')).toBeVisible();
    await expect(page.locator('text=총 문서 수')).toBeVisible();
    await expect(page.locator('text=카테고리별 문서 현황')).toBeVisible();
    await expect(page.locator('text=최근 활동 내역')).toBeVisible();
  });
});
