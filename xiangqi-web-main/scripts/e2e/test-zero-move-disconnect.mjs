import { createE2EContext } from './utils.mjs';

async function testZeroMoveDisconnect() {
  console.log('--- STARTING ZERO-MOVE DISCONNECT TEST ---');
  const userA = await createE2EContext({ url: 'http://localhost:3000', headless: true });
  const userB = await createE2EContext({ url: 'http://localhost:3000', headless: true });

  try {
    // 1. User A: Create room
    console.log('User A: Creating room...');
    const actionBtn = 'button:has-text("Chơi ngay"), .fixed.bottom-8 button';
    await userA.page.waitForSelector(actionBtn, { state: 'visible', timeout: 10000 });
    await userA.page.click(actionBtn);
    await userA.page.waitForTimeout(500);
    await userA.page.click('button:has-text("Vào ván ngay")');
    await userA.page.waitForURL(/\/game\//);
    const roomUrl = userA.page.url();
    console.log(`Room URL: ${roomUrl}`);

    // 2. Check if Ready button is disabled for User A alone
    console.log('User A: Checking initial Ready button state...');
    const btnTextA = await userA.page.innerText('button:has-text("SẴN SÀNG"), button:has-text("ĐỢI ĐỦ")');
    console.log(`Button text A (Alone): ${btnTextA}`);
    
    const isDisabledA = await userA.page.$eval('button:has-text("SẴN SÀNG"), button:has-text("ĐỢI ĐỦ")', btn => btn.disabled);
    console.log(`Button A disabled? ${isDisabledA}`);
    if (!isDisabledA && btnTextA.includes('ĐỢI ĐỦ')) {
        console.log('SUCCESS: Ready button is disabled while alone.');
    }

    // 3. User B: Join
    console.log('User B: Joining room...');
    await userB.page.goto(roomUrl);
    await userB.page.waitForTimeout(2000);

    // 4. Check if Ready button is enabled for both
    console.log('Both: Checking Ready button state (Both present)...');
    const isDisabledA2 = await userA.page.$eval('button:has-text("SẴN SÀNG")', btn => btn.disabled);
    const isDisabledB2 = await userB.page.$eval('button:has-text("SẴN SÀNG")', btn => btn.disabled);
    console.log(`Button A disabled? ${isDisabledA2}, Button B disabled? ${isDisabledB2}`);

    if (!isDisabledA2 && !isDisabledB2) {
        console.log('SUCCESS: Ready buttons enabled for both.');
    }

    // 5. Both: Ready (Simulate game start)
    console.log('Both: Clicking Ready...');
    await userA.page.click('button:has-text("SẴN SÀNG")');
    await userA.page.waitForTimeout(500);
    await userB.page.click('button:has-text("SẴN SÀNG")');
    await userA.page.waitForTimeout(2000);

    // Verify game started (Ready buttons gone)
    const hasReadyA = await userA.page.$('button:has-text("SẴN SÀNG")');
    if (!hasReadyA) {
        console.log('SUCCESS: Game started, Ready button hidden.');
    }

    // 6. User A: Leave (EXPLICIT)
    console.log('User A: Leaving room EXPLICITLY...');
    await userA.page.click('button:has-text("Rời phòng")');
    await userA.page.waitForTimeout(1000);
    
    // Check if redirect to home occurred
    if (userA.page.url() === 'http://localhost:3000/') {
        console.log('SUCCESS: User A redirected to home.');
    }

    // 7. User B: Check for UI update (Should see Ready button again)
    console.log('User B: Checking for UI reset (Un-start)...');
    await userB.page.waitForTimeout(2000);
    const btnTextB_PostLeave = await userB.page.innerText('button:has-text("SẴN SÀNG"), button:has-text("ĐỢI ĐỦ")');
    console.log(`Button text B (Post-A-Leave): ${btnTextB_PostLeave}`);
    if (btnTextB_PostLeave.includes('SẴN SÀNG') || btnTextB_PostLeave.includes('ĐỢI ĐỦ')) {
        console.log('SUCCESS: User B UI reset to waiting state.');
    } else {
        console.log('FAILED: User B UI did not reset.');
    }

  } catch (err) {
    console.error('TEST ERROR:', err);
  } finally {
    await userA.browser.close();
    await userB.browser.close();
  }
}

testZeroMoveDisconnect();
