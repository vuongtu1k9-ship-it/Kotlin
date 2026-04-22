import { chromium } from 'playwright';

export const createE2EContext = async ({ url, headless = true }) => {
  const browser = await chromium.launch({ headless, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Wait for the app to actually load
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('#root', { timeout: 10000 }).catch(e => console.log('DEBUG: #root not visible'));
  await page.waitForTimeout(1000); // Buffer for SPA hydration
  
  return { browser, context, page };
};

export const waitAndClick = async (page, selector, timeout = 5000) => {
  await page.waitForSelector(selector, { timeout });
  await page.click(selector);
};

export const getSidePanelText = async (page) => {
  return await page.evaluate(() => {
    const panels = document.querySelectorAll('.xq-board-wrap + div, .lg\\:order-2');
    return panels.length > 0 ? panels[0].innerText : '';
  });
};

export const movePieceByCellIndex = async (page, fromIdx, toIdx) => {
  // 1-indexed n-th child
  const fromSelector = `.xq-board-grid > *:nth-child(${fromIdx})`;
  const toSelector = `.xq-board-grid > *:nth-child(${toIdx})`;
  
  await page.click(fromSelector);
  await new Promise(r => setTimeout(r, 300));
  await page.click(toSelector);
};
