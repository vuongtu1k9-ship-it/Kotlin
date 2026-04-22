import { createE2EContext } from './utils.mjs';

async function testLobby() {
  console.log('--- STARTING LOBBY SYNC TEST ---');
  const userA = await createE2EContext({ url: 'http://localhost:3000', headless: true });
  userA.page.on('console', msg => console.log('BROWSER_UI:', msg.text()));
  const userB = await createE2EContext({ url: 'http://127.0.0.1:3000', headless: true });

  try {
    // User A: Click 'Chơi ngay' (specifically the floating one if needed)
    console.log('User A: Opening room configuration...');
    const actionBtn = 'button:has-text("Chơi ngay"), .fixed.bottom-8 button';
    await userA.page.waitForSelector(actionBtn, { state: 'visible', timeout: 10000 });
    await userA.page.click(actionBtn);
    await userA.page.waitForTimeout(1500);
    
    console.log('User A: Confirming room creation...');
    const confirmBtn = 'button:has-text("Vào ván ngay")';
    await userA.page.waitForSelector(confirmBtn, { timeout: 5000 }).catch(e => console.log('DEBUG: Confirm button not visible in 5s'));
    await userA.page.click(confirmBtn);
    
    console.log('User A: Waiting for redirect to game...');
    // Wait for the URL to change to the game page
    await userA.page.waitForURL(/\/game\//, { timeout: 10000 }).catch(e => console.log('DEBUG: URL did not change to /game/ in 10s. Current:', userA.page.url()));
    
    const currentUrl = userA.page.url();
    const roomId = currentUrl.includes('-') ? currentUrl.split('-').pop() : '';
    console.log(`Created Room ID: ${roomId} (URL: ${currentUrl})`);

    // User B: Check Lobby
    console.log('User B: Checking lobby for room...');
    // Ensure on Lobby
    await userB.page.goto('http://127.0.0.1:3000');
    await userB.page.waitForTimeout(2000);
    
    const lobbyText = await userB.page.innerText('body');
    if (lobbyText.includes(`#${roomId}`)) {
      console.log(`SUCCESS: Room #${roomId} visible in User B's lobby.`);
    } else {
      console.log(`FAILED: Room #${roomId} NOT found in User B's lobby.`);
      console.log('Lobby snippet (last 500 chars):', lobbyText.slice(-500));
    }

  } catch (err) {
    console.error('TEST ERROR:', err);
  } finally {
    await userA.browser.close();
    await userB.browser.close();
  }
}

testLobby();
