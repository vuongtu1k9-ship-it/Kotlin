import { chromium } from 'playwright';

async function runDualTest() {
  const SERVER_URL = 'http://localhost:3000'; // Final local port
  console.log('🚀 Starting Independent Dual-User Verification...');
  
  const browser = await chromium.launch({ 
    headless: true, // headless is required in the agent environment
    slowMo: 100      
  });

  // Create two completely independent browser contexts
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    // --- USER A: Room Creation ---
    console.log('[User A] Opening home page...');
    await pageA.goto(SERVER_URL);
    await pageA.waitForLoadState('networkidle');

    console.log('[User A] Opening Match Configuration Dialog...');
    // Button is "+ Thiết lập ván đấu" in LobbyPage.tsx
    await pageA.click('text="+ Thiết lập ván đấu"');
    
    // Title is an H2 containing "Sẵn sàng đấu" or "Tạo bàn mới" or specific text
    // Let's wait for any element with "TẠO BÀN MỚI" (uppercase in the UI usually)
    await pageA.waitForSelector('text="Tạo bàn mới"', { timeout: 30000 });
    
    console.log('[User A] Creating Public Room...');
    // Submit button is "Vào ván ngay" or similar
    await pageA.click('button:has-text("Vào ván ngay")');

    // Wait for navigation to /game/:id
    await pageA.waitForURL(/\/game\//);
    const roomIdA = pageA.url().split('/game/')[1].split('-')[0];
    console.log(`[User A] Room Created: ${roomIdA}`);

    // --- USER B: Joining ---
    console.log(`[User B] Navigating to Room ${roomIdA}...`);
    await pageB.goto(`${SERVER_URL}/game/${roomIdA}`);
    await pageB.waitForLoadState('networkidle');

    console.log('[User B] Attempting to join the match...');
    // Join button text in BoardControls or GamePage is usually "CHƠI"
    await pageB.waitForSelector('button:has-text("CHƠI")', { timeout: 30000 });
    await pageB.click('button:has-text("CHƠI")');

    // --- SYNC CHECK: Readiness ---
    console.log('[Both] Setting READY state...');
    await pageA.click('button:has-text("Sẵn sàng")');
    await pageB.click('button:has-text("Sẵn sàng")');

    console.log('[User A] Verifying game start (toast or status change)...');
    await pageA.waitForSelector('text="Trận đấu bắt đầu!"', { timeout: 30000 });

    // --- INTERACTION: Resign Flow ---
    console.log('[User B] Clicking RESIGN to test Confirm Dialog...');
    await pageB.click('button:has-text("Đầu hàng")');

    console.log('[User B] Verifying Premium Confirm Dialog appearance...');
    // Wait for the Confirm dialog with "Xác nhận" button
    await pageB.waitForSelector('h2:has-text("Xác nhận")', { timeout: 5000 });
    await pageB.click('button:has-text("Xác nhận")');

    // --- END GAME: Result Dialog ---
    console.log('[User A] Verifying Game Result Dialog...');
    // GameResultDialog usually has "Chức mừng!" or "Kết thúc"
    await pageA.waitForSelector('text="KẾT THÚC"', { timeout: 10000 });
    
    console.log('[User A] Verifying Premium Styling (Backdrop Blur check via CSS)...');
    const hasBlur = await pageA.evaluate(() => {
      const dialog = document.querySelector('.backdrop-blur-md');
      return !!dialog;
    });
    console.log(`[User A] Premium Backdrop Blur detected: ${hasBlur}`);

    console.log('✅ Independent Dual-User Verification Successful!');
    
    // Capturing final state
    await pageA.screenshot({ path: 'test-results/user-a-win.png' });
    await pageB.screenshot({ path: 'test-results/user-b-loss.png' });

  } catch (error) {
    console.error(`❌ Test failed with error: ${error.message || error}`);
    console.log(error);
  } finally {
    console.log('Closing browsers in 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
  }
}

runDualTest();
