import { createE2EContext } from './utils.mjs';

async function testMove() {
  console.log('--- STARTING GAMEPLAY MOVE SYNC TEST ---');
  const userA = await createE2EContext({ url: 'http://localhost:3000' });
  const userB = await createE2EContext({ url: 'http://127.0.0.1:3000' });

  try {
    // Both: Wait for login
    await userA.page.waitForTimeout(2000);
    await userB.page.waitForTimeout(2000);

    // User A: Create room
    const actionBtn = 'button:has-text("Chơi ngay"), .fixed.bottom-8 button';
    await userA.page.waitForSelector(actionBtn, { state: 'visible', timeout: 10000 });
    await userA.page.click(actionBtn);
    await userA.page.waitForTimeout(1000);
    await userA.page.click('button:has-text("Vào ván ngay")');
    await userA.page.waitForURL(/\/game\//);
    const roomUrl = userA.page.url();
    console.log(`Room URL: ${roomUrl}`);

    // User B: Join
    await userB.page.goto(roomUrl.replace('localhost', '127.0.0.1'));
    await userB.page.waitForTimeout(2000);

    // Both: Ready
    console.log('Players: Setting ready...');
    await userA.page.click('button:has-text("SẴN SÀNG")');
    await userB.page.click('button:has-text("SẴN SÀNG")');
    await userA.page.waitForTimeout(500);
    
    // User B (or whoever is second): Start
    if (await userB.page.isVisible('button:has-text("BẮT ĐẦU")')) {
        await userB.page.click('button:has-text("BẮT ĐẦU")');
    } else if (await userA.page.isVisible('button:has-text("BẮT ĐẦU")')) {
        await userA.page.click('button:has-text("BẮT ĐẦU")');
    }
    await userA.page.waitForTimeout(1000);

    // Move: Red Cannon (7,1) -> (7,4)
    // Row 7, Col 1 is index 65 (7*9 + 1 + 1)
    // Row 7, Col 4 is index 68
    console.log('User Red: Moving Cannon to center...');
    await userA.page.click('.xq-board-grid > *:nth-child(65)');
    await userA.page.waitForTimeout(500);
    await userA.page.click('.xq-board-grid > *:nth-child(68)');
    
    await userA.page.waitForTimeout(2000);

    // VERIFY: Check Move List on BOTH
    const moveListA = await userA.page.innerText('.lg\\:order-2');
    const moveListB = await userB.page.innerText('.lg\\:order-2');

    if (moveListA.includes('炮 7,1 → 7,4') && moveListB.includes('炮 7,1 → 7,4')) {
        console.log('SUCCESS: Move synchronized correctly on both screens.');
        console.log(`Step indicator: ${moveListA.includes('STEP 1') ? 'STEP 1' : 'Check manually'}`);
    } else {
        console.log('FAILED: Move NOT found in one or both move lists.');
    }

  } catch (err) {
    console.error('TEST ERROR:', err);
  } finally {
    await userA.browser.close();
    await userB.browser.close();
  }
}

testMove();
