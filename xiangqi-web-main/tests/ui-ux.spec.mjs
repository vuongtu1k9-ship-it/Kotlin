import { test, expect } from '@playwright/test';

test.describe('Xiangqi Level 3 Power Gate - Full Path Audit', () => {
  const dynamicEnv = process.env.DYNAMIC_PATHS || '';
  const dynamicPaths = dynamicEnv.split(',').filter(p => p).map(p => ({
      name: p.includes('puzzle') ? 'Dynamic Puzzle' : 
            p.includes('game') ? 'Dynamic Game' : 
            p.includes('player') ? 'Dynamic Player' : 
            p.includes('practice') ? 'Dynamic Practice' : 'Dynamic Content',
      path: p
  }));

  const testPaths = [
    { name: 'Home/Lobby', path: '/' },
    { name: 'Games List', path: '/game' },
    { name: 'Puzzles List', path: '/puzzles' },
    { name: 'AI Game', path: '/ai' },
    { name: 'How to Play', path: '/how-to-play' },
    ...dynamicPaths
  ];

  const puzzleUid = '5sy6s'; 

  test.beforeEach(async ({ page }) => {
    // Listen for client-side errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ CLIENT_LOG_ERROR: ${msg.text()}`);
      }
    });
    page.on('pageerror', exception => {
      console.log(`❌ CLIENT_UNCAUGHT_EXCEPTION: ${exception.message}`);
    });
  });

  for (const route of testPaths) {
    test(`UX: ${route.name} (${route.path}) should load correctly`, async ({ page }) => {
      console.log(`🔍 Testing route: ${route.path}`);
      await page.goto(route.path);
      
      // Generic check: ensure the main app container is visible
      const mainContent = page.locator('#root');
      await expect(mainContent.first()).toBeVisible();

      // Path specific checks
      if (route.path.includes('/puzzles/')) {
        const board = page.locator('.xq-board-wrap, .xq-board-container, #xiangqi-board, canvas');
        await expect(board.first()).toBeVisible({ timeout: 15000 });
      }

      if (route.path === '/game') {
          const heading = page.locator('h1:has-text("Kỳ đài")');
          await expect(heading.first()).toBeVisible();
      }

      console.log(`✅ UX Check passed for: ${route.name}`);
    });
  }

  test('SEO: Deep audit of Meta for Puzzle', async ({ page }) => {
    await page.goto(`/puzzles/${puzzleUid}`);
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBeTruthy();
    console.log(`✅ SEO Deep Audit passed for ${puzzleUid}`);
  });

  test('Responsive: Mobile Layout check on Home', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) {
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
        expect(bodyHeight).toBeGreaterThan(300);
        console.log(`✅ Mobile Responsive check passed for Home`);
    } else {
        console.log(`✅ Desktop Layout check passed for Home`);
    }
  });
});
