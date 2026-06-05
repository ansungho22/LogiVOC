# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase3.spec.ts >> Phase 3 Routing & Ontology CRUD >> should perform CRUD operations on Ontology (Category) in System Admin
- Location: tests/phase3.spec.ts:22:3

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.fill: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('input[placeholder="e.g. Frontend Architecture"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - link "OmniLog AI" [ref=e6] [cursor=pointer]:
        - /url: /
        - img [ref=e8]
        - heading "OmniLog AI" [level=1] [ref=e10]
      - navigation [ref=e11]:
        - link "Workspaces" [ref=e12] [cursor=pointer]:
          - /url: /workspace
          - img [ref=e13]
          - text: Workspaces
        - link "Data Registration" [ref=e18] [cursor=pointer]:
          - /url: /data-registration
          - img [ref=e19]
          - text: Data Registration
        - link "Admin" [ref=e23] [cursor=pointer]:
          - /url: /system-admin
          - img [ref=e24]
          - text: Admin
  - main [ref=e27]:
    - generic [ref=e28]:
      - generic [ref=e29]:
        - heading "관리자 메뉴" [level=2] [ref=e30]
        - button "대시보드" [ref=e31]:
          - img [ref=e32]
          - text: 대시보드
        - button "데이터 / 지식 관리" [ref=e37]:
          - img [ref=e38]
          - text: 데이터 / 지식 관리
        - button "사용자 관리" [ref=e42]:
          - img [ref=e43]
          - text: 사용자 관리
        - button "카테고리 관리" [ref=e48]:
          - img [ref=e49]
          - text: 카테고리 관리
      - generic [ref=e51]:
        - generic [ref=e52]:
          - generic [ref=e53]:
            - generic [ref=e54]:
              - heading "카테고리 관리" [level=2] [ref=e55]:
                - img [ref=e56]
                - text: 카테고리 관리
              - paragraph [ref=e58]: 지식 베이스의 분류 체계를 관리합니다.
            - button "새 카테고리" [active] [ref=e59]:
              - img [ref=e60]
              - text: 새 카테고리
          - generic [ref=e62]:
            - img [ref=e63]
            - textbox "카테고리 검색..." [ref=e66]
          - generic [ref=e69]:
            - generic [ref=e70]:
              - heading "Default" [level=3] [ref=e71]
              - generic [ref=e72]:
                - button [ref=e73]:
                  - img [ref=e74]
                - button [ref=e76]:
                  - img [ref=e77]
            - paragraph [ref=e80]: 설명이 없습니다.
            - generic [ref=e82]: "ID: 7a7b6124"
        - generic [ref=e83]:
          - generic [ref=e84]:
            - heading "새 카테고리" [level=3] [ref=e85]:
              - img [ref=e86]
              - text: 새 카테고리
            - button [ref=e87]:
              - img [ref=e88]
          - generic [ref=e91]:
            - generic [ref=e92]:
              - generic [ref=e93]: 카테고리 이름 *
              - 'textbox "예: 프론트엔드 아키텍처" [ref=e94]'
            - generic [ref=e95]:
              - generic [ref=e96]: 설명
              - textbox "이 카테고리에 포함될 문서에 대해 설명하세요..." [ref=e97]
            - generic [ref=e98]:
              - button "취소" [ref=e99]
              - button "저장" [disabled] [ref=e100]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Phase 3 Routing & Ontology CRUD', () => {
  4  |   test('should navigate between Workspaces, Data Registration, and Admin', async ({ page }) => {
  5  |     // 1. Visit root, should show Workspace (or click Workspace)
  6  |     await page.goto('/');
  7  |     
  8  |     // Check if we are on Workspace
  9  |     await expect(page.locator('text=통합 문서 검색').first()).toBeVisible();
  10 | 
  11 |     // 2. Click Data Registration
  12 |     await page.click('a[href="/data-registration"]');
  13 |     await expect(page).toHaveURL(/.*\/data-registration/);
  14 |     await expect(page.locator('text=Upload Document').first()).toBeVisible();
  15 | 
  16 |     // 3. Click Admin
  17 |     await page.click('a[href="/system-admin"]');
  18 |     await expect(page).toHaveURL(/.*\/system-admin/);
  19 |     await expect(page.locator('text=시스템 대시보드').first()).toBeVisible();
  20 |   });
  21 | 
  22 |   test('should perform CRUD operations on Ontology (Category) in System Admin', async ({ page }) => {
  23 |     page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  24 |     page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  25 |     await page.goto('/system-admin');
  26 |     
  27 |     // Wait for the page to load (Dashboard or Data by default)
  28 |     await expect(page.locator('text=시스템 대시보드').first()).toBeVisible();
  29 | 
  30 |     // Click Categories tab in left nav
  31 |     await page.click('button:has-text("카테고리 관리")');
  32 |     await expect(page.locator('text=카테고리 관리').first()).toBeVisible();
  33 | 
  34 |     // Create a unique category name to avoid conflicts
  35 |     const categoryName = `E2E Test Category ${Date.now()}`;
  36 |     const updatedCategoryName = `${categoryName} (Updated)`;
  37 | 
  38 |     // CREATE
  39 |     await page.click('button:has-text("새 카테고리")', { force: true });
  40 |     await expect(page.locator('text=새 카테고리').nth(1)).toBeVisible(); // Drawer title
  41 | 
  42 |     // Fill form
> 43 |     await page.fill('input[placeholder="e.g. Frontend Architecture"]', categoryName);
     |                ^ Error: page.fill: Test timeout of 120000ms exceeded.
  44 |     await page.fill('textarea[placeholder="Describe what kind of documents belong here..."]', 'This is a test category created by E2E test.');
  45 |     await page.click('button:has-text("저장")', { force: true });
  46 | 
  47 |     // Wait for modal to disappear or category to appear in list
  48 |     await page.waitForTimeout(500);
  49 | 
  50 |     // Verify it exists in the list
  51 |     await expect(page.locator(`text=${categoryName}`).first()).toBeVisible();
  52 | 
  53 |     // EDIT
  54 |     // Find the category block, then click Edit
  55 |     const categoryBlock = page.locator('div.bg-slate-950\\/50', { hasText: categoryName });
  56 |     await categoryBlock.locator('button', { has: page.locator('svg') }).nth(0).click({ force: true });
  57 |     
  58 |     await expect(page.locator('text=카테고리 수정')).toBeVisible();
  59 |     await page.fill('input[placeholder="e.g. Frontend Architecture"]', updatedCategoryName);
  60 |     await page.click('button:has-text("저장")', { force: true });
  61 | 
  62 |     await page.waitForTimeout(500);
  63 | 
  64 |     // Verify updated name
  65 |     await expect(page.locator(`text=${updatedCategoryName}`).first()).toBeVisible();
  66 | 
  67 |     // DELETE
  68 |     const updatedCategoryBlock = page.locator('div.bg-slate-950\\/50', { hasText: updatedCategoryName });
  69 |     
  70 |     // Handle the confirm dialog natively
  71 |     page.on('dialog', dialog => dialog.accept());
  72 |     
  73 |     await updatedCategoryBlock.locator('button', { has: page.locator('svg') }).nth(1).click({ force: true });
  74 |     
  75 |     await page.waitForTimeout(500);
  76 | 
  77 |     // Verify deletion
  78 |     await expect(page.locator(`text=${updatedCategoryName}`).first()).not.toBeVisible();
  79 |   });
  80 | });
  81 | 
```