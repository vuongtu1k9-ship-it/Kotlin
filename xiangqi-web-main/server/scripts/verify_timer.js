
import { chromium } from 'playwright';
import { logger } from './server/logger.mjs';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  
  // Player 1 (Red)
  const page1 = await context.newPage();
  await page1.goto('http://localhost:3000');
  
  // Login or join as guest
  await page1.click('text=Chơi ngay (Khách)');
  await page1.waitForSelector('text=Tạo bàn');
  await page1.click('text=Tạo bàn');
  await page1.waitForSelector('text=Phòng');
  const url = page1.url();
  const roomId = url.split('/').pop();
  logger.log('Room created:', roomId);

  // Player 2 (Black)
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.goto(url);
  await page2.click('text=Chơi ngay (Khách)');
  await page2.waitForSelector('text=Bạn là Cầm Đen');

  // Red makes a move to start the clock
  // (Assuming standard board setup, move Red Soldier or something)
  // For simplicity, let's just wait for the clock to be started by the server
  // The server starts the clock when both are present and Red moves.
  
  // Trigger Red move
  // Click cell (6,0) then (5,0) - Red Soldier
  await page1.click('div[data-row="6"][data-col="0"]');
  await page1.click('div[data-row="5"][data-col="0"]');
  
  logger.log('Red moved. Waiting for Black turn to tick...');
  await page2.waitForTimeout(10000); // Wait 10 seconds
  
  // Capture timer text before refresh
  const timerBefore = await page2.textContent('b'); 
  logger.log('Timer before refresh:', timerBefore);
  
  // Refresh page 2
  await page2.reload();
  await page2.waitForSelector('text=Lượt Đen');
  
  const timerAfter = await page2.textContent('b');
  logger.log('Timer after refresh:', timerAfter);
  
  if (timerAfter.includes('03:00') || timerAfter.includes('3:00')) {
     logger.error('FAIL: Timer reset to 3:00!');
  } else {
     logger.log('SUCCESS: Timer preserved state.');
  }

  await browser.close();
})();
