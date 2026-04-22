import { createE2EContext } from './utils.mjs';

async function fullGameTest() {
  console.log('--- STARTING STANDARD FULL GAME E2E TEST ---');
  const userA = await createE2EContext({ url: 'http://localhost:3000' });
  userA.page.on('console', msg => console.log('BROWSER_A:', msg.text()));
  
  const userB = await createE2EContext({ url: 'http://127.0.0.1:3000' });
  userB.page.on('console', msg => console.log('BROWSER_B:', msg.text()));

  try {
    // 1. CREATE ROOM (User A)
    console.log('User A: Creating room...');
    const actionBtn = 'button:has-text("Chơi ngay"), .fixed.bottom-8 button';
    await userA.page.waitForSelector(actionBtn, { state: 'visible' });
    await userA.page.click(actionBtn);
    await userA.page.waitForTimeout(1000);
    await userA.page.click('button:has-text("Vào ván ngay")');
    await userA.page.waitForURL(/\/game\//);
    const roomUrl = userA.page.url();
    console.log(`Room Created: ${roomUrl}`);

    // 2. JOIN ROOM (User B)
    console.log('User B: Joining room...');
    await userB.page.goto(roomUrl.replace('localhost', '127.0.0.1'), { waitUntil: 'networkidle' });
    await userB.page.waitForTimeout(2000);

    // 3. READY (Both)
    console.log('Players: Setting ready...');
    await userA.page.click('button:has-text("SẴN SÀNG")');
    await userB.page.click('button:has-text("SẴN SÀNG")');
    await userA.page.waitForTimeout(2000);

    // 4. FIRST MOVE (User A - Red)
    // Red Cannon 7,1 -> 7,4 (Center) -> Index 65 to 68
    console.log('User A: Making first move (Cannon to center)...');
    await userA.page.click('.xq-board-grid > *:nth-child(65)');
    await userA.page.waitForTimeout(400);
    await userA.page.click('.xq-board-grid > *:nth-child(68)');
    await userA.page.waitForTimeout(2000);

    // 5. RESIGN (User B - Black)
    console.log('User B: Resigning (Xin thua)...');
    await userB.page.click('button:has-text("Xin Thua")');
    await userB.page.waitForTimeout(1000);
    // User B: Confirm the dialog
    await userB.page.click('.modal-confirm-btn, button:has-text("Xác nhận"), button:has-text("CHẤP NHẬN")');
    await userB.page.waitForTimeout(3000);

    // 6. VERIFY RESULTS DIALOG (Both)
    console.log('Verifying Results Dialog and Scoring UI...');
    const resultVisibleA = await userA.page.isVisible('text="Ván đấu kết thúc"');
    const resultVisibleB = await userB.page.isVisible('text="Ván đấu kết thúc"');
    
    // Check for score/elo text if possible
    const scoreTextA = await userA.page.innerText('body');
    const hasEloInfo = scoreTextA.includes('ELO') || scoreTextA.includes('🪙');

    if (resultVisibleA && resultVisibleB) {
        console.log('SUCCESS: Full Game Lifecycle Passed!');
        console.log(`Scoring Info Visible: ${hasEloInfo ? 'YES' : 'NO (Check manual)'}`);
    } else {
        console.log('FAILED: Results dialog did not appear on one or both screens.');
    }

  } catch (err) {
    console.error('TEST FATAL ERROR:', err);
  } finally {
    // Optionally keep open to inspect or close
    await userA.browser.close();
    await userB.browser.close();
    console.log('--- TEST COMPLETED ---');
  }
}

fullGameTest();
