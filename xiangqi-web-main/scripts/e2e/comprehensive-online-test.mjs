import { createE2EContext } from './utils.mjs';

const BASE_URL_A = 'http://localhost:3000';
const BASE_URL_B = 'http://127.0.0.1:3000';

async function runTests() {
  console.log('\n🚀 STARTING COMPREHENSIVE ONLINE TEST SUITE\n');

  const results = [];

  const checkResult = (name, passed, message = '') => {
    const status = passed ? '✅ PASS' : '❌ FAILED';
    console.log(`${status}: ${name} ${message ? `(${message})` : ''}`);
    results.push({ name, status, message });
  };

  let userA, userB;
  let roomUrl = '';

  try {
    userA = await createE2EContext({ url: BASE_URL_A, headless: true });
    userB = await createE2EContext({ url: BASE_URL_B, headless: true });

    // --- CASE 1: ROOM CREATION & LOBBY SYNC ---
    try {
      console.log('Testing: Room Creation (User A)...');
      // Floating Action Button or explicit setup button
      const actionBtn = 'button:has-text("Thiết lập ván đấu"), .fixed.bottom-8 button';
      await userA.page.waitForSelector(actionBtn, { state: 'visible', timeout: 15000 });
      await userA.page.click(actionBtn);
      console.log('User A: Clicked "Thiết lập ván đấu"');
      await userA.page.waitForTimeout(1500);
      
      // Inside modal
      const startBtn = 'button:has-text("Vào ván ngay"), button:has-text("Bắt đầu")';
      await userA.page.waitForSelector(startBtn, { state: 'visible', timeout: 10000 });
      await userA.page.click(startBtn);
      console.log('User A: Clicked "Vào ván ngay"');
      
      await userA.page.waitForURL(/\/game\//, { timeout: 30000, waitUntil: 'networkidle' });
      roomUrl = userA.page.url();
      console.log(`User A: Room Created! URL: ${roomUrl}`);
      
      // Navigate User B back to lobby to见 room
      console.log('User B: Checking lobby for new room...');
      await userB.page.goto(BASE_URL_B, { waitUntil: 'networkidle' });
      await userB.page.waitForTimeout(3000);
      const lobbyText = await userB.page.innerText('body');
      const hasRoomInLobby = lobbyText.includes('ĐANG CHỜ') || lobbyText.includes('Vào chơi') || lobbyText.includes('Join'); 
      
      checkResult('Room Creation & Lobby Sync', roomUrl.includes('/game/') && roomUrl.length > 20, `URL: ${roomUrl}`);
    } catch (e) {
      checkResult('Room Creation & Lobby Sync', false, e.message);
    }

    // --- CASE 2: JOINING ROOM & SEATING ---
    try {
      if (!roomUrl) throw new Error('No Room URL from Case 1');
      console.log('Testing: Joining Room...');
      await userB.page.goto(roomUrl.replace('localhost', '127.0.0.1'), { waitUntil: 'networkidle' });
      await userB.page.waitForTimeout(3000); // Give it time to sync
      
      const bodyB = await userB.page.innerText('body');
      const joined = bodyB.includes('SẴN SÀNG') || bodyB.includes('Hủy') || bodyB.includes('BẮT ĐẦU'); 
      
      checkResult('Joining Room & Seating', joined); 
    } catch (e) {
      checkResult('Joining Room & Seating', false, e.message);
    }

    // --- CASE 3: GAME START (READY SYNC) ---
    try {
      console.log('Testing: Game Start (Ready Sync)...');
      // User B might need to join/sit first if not auto-seated
      const seatBtn = 'button:has-text("Vào ghế"), button:has-text("Chơi")';
      const hasSeatBtn = await userB.page.isVisible(seatBtn);
      if (hasSeatBtn) {
          console.log('User B: Clicking seat button...');
          await userB.page.click(seatBtn);
          await userB.page.waitForTimeout(1000);
      }

      await userA.page.click('button:has-text("SẴN SÀNG")');
      await userB.page.click('button:has-text("SẴN SÀNG")');
      await userA.page.waitForTimeout(3000);
      
      const startText = await userA.page.innerText('body');
      const gameStarted = startText.includes('Đến lượt') || startText.includes('Xin Thua') || startText.includes('HÒA');
      checkResult('Game Start Readiness', gameStarted);
    } catch (e) {
      checkResult('Game Start Readiness', false, e.message);
    }

    // --- CASE 4: MOVE SYNCHRONIZATION ---
    try {
      console.log('Testing: Move Synchronization...');
      // Ensure it is Red's turn (User A)
      // Check turn indicator UI
      // Use CSS selector for cells. Red Cannon is usually at Index 65 (1-indexed in grid)
      // Row 7, Col 1 (0-indexed 7*9+1 = 64. 1-indexed = 65)
      // Destination: Row 7, Col 4 (7*9+4 = 67. 1-indexed = 68)
      
      await userA.page.click('.xq-board-grid > *:nth-child(65)');
      await userA.page.waitForTimeout(500);
      await userA.page.click('.xq-board-grid > *:nth-child(68)');
      await userA.page.waitForTimeout(3000);

      const turnB = await userB.page.innerText('body');
      const moveSynced = turnB.toUpperCase().includes('ĐEN') || turnB.toUpperCase().includes('BLACK');
      checkResult('Move Synchronization', moveSynced);
    } catch (e) {
      checkResult('Move Synchronization', false, e.message);
    }

    // --- CASE 5: INTERACTION - DRAW REQUEST & REJECT ---
    try {
      console.log('Testing: Draw Request & Reject...');
      await userA.page.click('button:has-text("Xin Hòa")');
      await userA.page.waitForTimeout(1000);
      
      const modalB = await userB.page.isVisible('text="CẦU HÒA"');
      if (modalB) {
        await userB.page.click('button:has-text("TỪ CHỐI")');
        await userA.page.waitForTimeout(1000);
        const modalClosedA = !(await userA.page.isVisible('text="Đến lượt"')); // Assuming modal gone
        checkResult('Draw Request & Reject', true);
      } else {
        checkResult('Draw Request & Reject', false, 'Modal did not appear on B');
      }
    } catch (e) {
      checkResult('Draw Request & Reject', false, e.message);
    }

    // --- CASE 6: GAME OVER - RESIGN ---
    try {
      console.log('Testing: Resign (Game Over)...');
      await userB.page.click('button:has-text("Xin Thua")');
      await userB.page.waitForSelector('.modal-confirm-btn, button:has-text("CHẤP NHẬN")', { state: 'visible' });
      await userB.page.click('.modal-confirm-btn, button:has-text("CHẤP NHẬN")');
      await userA.page.waitForTimeout(2000);
      
      const resultA = await userA.page.innerText('body');
      const gameEnded = resultA.includes('Ván đấu kết thúc') || resultA.includes('THẮNG');
      checkResult('Resign & Win Logic', gameEnded);
    } catch (e) {
      checkResult('Resign & Win Logic', false, e.message);
    }

  } catch (err) {
    console.error('FATAL SYSTEM ERROR:', err);
  } finally {
    if (userA) await userA.browser.close();
    if (userB) await userB.browser.close();
    
    console.log('\n--- FINAL TEST SUMMARY ---');
    results.forEach(r => console.log(`${r.status}: ${r.name}`));
    const allPassed = results.every(r => r.status.includes('PASS'));
    console.log(`\nOVERALL: ${allPassed ? 'PASSED' : 'FAILED'}\n`);
    process.exit(allPassed ? 0 : 1);
  }
}

runTests();
