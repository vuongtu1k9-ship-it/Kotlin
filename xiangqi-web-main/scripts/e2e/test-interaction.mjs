import { createE2EContext } from './utils.mjs';

async function testInteraction() {
  console.log('--- STARTING INTERACTION SYNC TEST (DRAW REQUEST) ---');
  const userA = await createE2EContext({ url: 'http://localhost:3000' });
  const userB = await createE2EContext({ url: 'http://127.0.0.1:3000' });

  try {
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
    await userA.page.waitForTimeout(1000);

    // User A: Click 'Xin Hòa'
    console.log('User A: Requesting Draw...');
    await userA.page.click('button:has-text("Xin Hòa")');
    await userA.page.waitForTimeout(2000);

    // User B: Confirm dialog appears
    console.log('User B: Checking for draw request modal...');
    const modalText = await userB.page.innerText('body');
    if (modalText.includes('CẦU HÒA') || modalText.includes('đối thủ muốn xin hòa')) {
      console.log('SUCCESS: Draw request modal appeared on User B\'s screen.');
      console.log('User B: Clicking "Từ chối" (Decline)...');
      await userB.page.click('button:has-text("TỪ CHỐI"), button:has-text("Từ chối")');
      await userB.page.waitForTimeout(1000);
      console.log('User B: Modal closed.');
    } else {
        console.log('FAILED: No draw request modal visible on User B\'s screen.');
    }

  } catch (err) {
    console.error('TEST ERROR:', err);
  } finally {
    await userA.browser.close();
    await userB.browser.close();
  }
}

testInteraction();
