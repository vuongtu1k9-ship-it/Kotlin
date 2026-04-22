
import { rooms } from './server/services/roomManager.mjs';

function checkRooms() {
  console.log('--- 🎮 ACTIVE ROOMS CHECK ---');
  console.log(`Total rooms in memory: ${rooms.size}`);
  
  for (const [id, state] of rooms.entries()) {
    const players = state.playerUids || {};
    const red = players.red || 'none';
    const black = players.black || 'none';
    console.log(`- Room: ${id} | Started: ${state.started} | Finished: ${state.finished} | Red: ${red} | Black: ${black} | Moves: ${state.moveHistory?.length || 0}`);
  }
  process.exit(0);
}

checkRooms();
