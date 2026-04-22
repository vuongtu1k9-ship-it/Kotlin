import axios from 'axios';
import { io } from 'socket.io-client';
import { UciEngine, boardToFen, uciToMoveCoords } from './engine.mjs';

const SURNAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đào', 'Võ', 'Đinh'];
const MID_NAMES = ['Văn', 'Thị', 'Hữu', 'Minh', 'Ngọc', 'Thanh', 'Anh', 'Quang', 'Xuân', 'Đức', 'Trọng', 'Bảo'];
const GIVEN_NAMES = ['Hoa', 'Minh', 'Tuấn', 'Lan', 'Hương', 'Dũng', 'Phương', 'Thắng', 'Nam', 'Bình', 'Hải', 'Sơn', 'Trúc', 'Vy', 'Linh', 'Cường', 'Quân'];

function generateVietnameseName() {
  const s = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  const m = MID_NAMES[Math.floor(Math.random() * MID_NAMES.length)];
  const g = GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
  const rand = Math.random();
  if (rand < 0.4) return `${s} ${m} ${g}`;
  if (rand < 0.7) return `${s} ${g}`;
  return `${m} ${g}`;
}

/**
 * Modernized Xiangqi Bot
 * Fully integrated with the latest server protocols and modularized.
 */
class XiangqiBot {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://cotuong.xyz';
    this.apiUrl = `${this.baseUrl}/api`;
    this.socketUrl = this.baseUrl;
    this.email = config.email;
    this.password = config.password;
    this.pikafishPath = config.pikafishPath || '/home/hoan/Pikafish/src/pikafish';
    this.level = parseInt(process.env.BOT_LEVEL || config.level || '5', 10);
    this.thinkTime = config.thinkTime || 2000;

    this.token = null;
    this.uid = null;
    this.name = config.name || generateVietnameseName();
    this.picture = config.picture || `https://i.pravatar.cc/150?u=${encodeURIComponent(this.email)}`;
    this.socket = null;
    this.engine = null;
    this.currentRoomId = null;
    this.side = null;
    this.moveIndex = 0;
    this.isThinking = false;
    this.gameStarted = false;
    this.gamesPlayed = 0;
    this.maxGames = config.maxGamesPerSession || 0;
    this.personality = config.personality || 'balanced';
    this.playWithHumans = config.playWithHumans ?? true;
    this.canInvite = config.canInvite ?? true;
    this.acceptInvites = config.acceptInvites ?? true;
    this.shouldStop = false; // Flag for graceful shutdown
  }

  async start() {
    console.log(`[Bot] Starting for ${this.email}...`);
    try {
      await this.authenticate();
      this.initEngine();
      this.initSocket();
    } catch (err) {
      console.error(`[Bot] Initialization failed:`, err.message);
      process.exit(1);
    }
  }

  async authenticate() {
    console.log(`[Bot] Authenticating at ${this.apiUrl}...`);
    try {
      const res = await axios.post(`${this.apiUrl}/auth/login`, {
        email: this.email,
        password: this.password,
      });
      this.token = res.data.token;
      this.uid = res.data.user.uid;
      this.name = res.data.user.name;
      this.picture = res.data.user.picture;
      console.log(`[Bot] Logged in as ${this.name} (${this.uid})`);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 404) {
        console.log(`[Bot] Account not found, registering...`);
        const reg = await axios.post(`${this.apiUrl}/auth/register`, {
          email: this.email,
          password: this.password,
          name: this.name,
          picture: this.picture,
        });
        this.token = reg.data.token;
        this.uid = reg.data.user.uid;
        this.name = reg.data.user.name;
        this.picture = reg.data.user.picture;
        console.log(`[Bot] Registered as ${this.name} with avatar`);
      } else {
        throw err;
      }
    }
  }

  initEngine() {
    console.log(`[Bot] Initializing Pikafish at ${this.pikafishPath}`);
    this.engine = new UciEngine(this.pikafishPath);
    this.engine.start();
    this.engine.on('ready', () => {
      // Map levels 1-6 to Pikafish Skill Level 0-20 for clear differentiation
      const skillMap = [0, 0, 4, 8, 12, 16, 20]; // index 1-6
      const skillLevel = skillMap[this.level] || 10;
      console.log(`[Bot] ${this.name} (Level ${this.level}) ready. Setting Skill Level: ${skillLevel}`);
      this.engine.write(`setoption name Skill Level value ${skillLevel}`);
    });
  }

  initSocket() {
    console.log(`[Bot] Connecting to socket ${this.socketUrl}...`);
    this.socket = io(this.socketUrl, {
      auth: { token: this.token },
    });

    this.socket.on('connect', () => {
      console.log(`[Bot] Socket connected: ${this.socket.id}`);
      this.socket.emit('room:active_check');
    });

    this.socket.on('disconnect', () => {
      console.log(`[Bot] Socket disconnected. Clearing room state.`);
      this.currentRoomId = null;
      this.side = null;
      this.gameStarted = false;
      this.isThinking = false;
    });

    this.socket.on('room:active_game', (data) => {
      if (data.roomId) {
        this.joinRoom(data.roomId);
      } else {
        this.scanLobby();
      }
    });

    this.socket.on('game:state', (state) => this.onGameState(state));
    this.socket.on('game:move', (data) => {
      if (data.roomId === this.currentRoomId) {
        // Immediate state update to prevent stale verification during thinking
        if (this.lastState) {
          this.lastState.serverMoveIndex = data.serverMoveIndex;
          this.lastState.currentPlayer = data.currentPlayer;
        }
        this.moveIndex = data.serverMoveIndex;
        this.sync();
      }
    });

    this.socket.on('room:invitation', (data) => {
      if (!this.currentRoomId || !this.gameStarted) {
        console.log(`[Bot] Accepting invitation to ${data.roomId}`);
        this.joinRoom(data.roomId);
      }
    });

    this.socket.on('game:over', (data) => {
      console.log(`[Bot] Game Over. Winner: ${data.winner}. Leaving in 5s...`);
      this.gamesPlayed++;
      
      if (this.shouldStop) {
        console.log(`[Bot] Graceful stop pending. Shutting down now.`);
        setTimeout(() => process.exit(0), 5000);
        return;
      }

      if (this.maxGames > 0 && this.gamesPlayed >= this.maxGames) {
        console.log(`[Bot] Reached game limit (${this.maxGames}). Shutting down...`);
        setTimeout(() => process.exit(0), 5000);
      } else {
        setTimeout(() => this.leaveRoom(), 5000);
      }
    });
  }

  joinRoom(roomId) {
    if (this.currentRoomId === roomId) return;
    if (this.currentRoomId) this.leaveRoom();
    
    this.currentRoomId = roomId;
    console.log(`[Bot:${this.name}] Joining room: ${roomId}`);
    this.socket.emit('room:join', { roomId }, (res) => {
      if (res.ok) {
        this.side = res.side;
        console.log(`[Bot:${this.name}] Joined room ${roomId} as ${this.side}`);
        this.sync();
      } else {
        console.error(`[Bot:${this.name}] Join failed for ${roomId}: ${res.error}`);
        this.currentRoomId = null;
        this.side = null;
      }
    });
  }

  leaveRoom() {
    if (!this.currentRoomId) return;
    this.socket.emit('room:leave', { roomId: this.currentRoomId });
    this.currentRoomId = null;
    this.gameStarted = false;
    this.side = null;
    this.isThinking = false;
    console.log(`[Bot] Left room. Scanning lobby...`);
    this.scanLobby();
  }

  sync() {
    if (!this.currentRoomId) return;
    this.socket.emit('game:sync', { roomId: this.currentRoomId }, (state) => {
      this.onGameState(state);
    });
  }

  onGameState(state) {
    if (!state) return;
    
    // STRICT: Only process states for the room we are currently in
    if (state.roomId && this.currentRoomId && state.roomId !== this.currentRoomId) {
      return;
    }

    this.moveIndex = state.serverMoveIndex || 0;
    this.gameStarted = state.started;
    this.timeControl = state.timeControl;
    this.clock = state.clock;

    if (state.finished) return;

    // IMPORTANT: Re-verify side in case it changed (e.g. new game in same room)
    let newSide = null;
    if (state.players) {
      if (state.players.redUid === this.uid) newSide = 'red';
      else if (state.players.blackUid === this.uid) newSide = 'black';
    }
    
    if (this.side && !newSide) {
      console.warn(`[Bot:${this.name}] Lost seat in room ${this.currentRoomId}. Clearing side.`);
    }
    this.side = newSide;

    // Handle Thinking (Allow move on first turn even if not 'started' yet)
    const isMyTurn = state.currentPlayer === this.side;
    const canMove = state.started || state.serverMoveIndex === 0;

    // Store latest state for verification inside think()
    this.lastState = state;

    if (canMove && isMyTurn && this.side) {
      if (this.isThinking) {
        // If already thinking but state changed (new move from opponent),
        // we should ideally restart thinking for the new position.
        const prevStartMoveIndex = this.startMoveIndex;
        if (state.serverMoveIndex !== prevStartMoveIndex) {
            console.log(`[Bot:${this.name}] New move detected while thinking. Aborting stale analysis.`);
            this.engine.abortAll();
            this.isThinking = false; // Reset so we can start new think
            this.think(state);
        }
      } else {
        this.think(state);
      }
    } else if (this.isThinking && !isMyTurn) {
        // Not my turn anymore, stop engine
        console.log(`[Bot:${this.name}] No longer my turn. Aborting analysis.`);
        this.engine.abortAll();
        this.isThinking = false;
    }
  }

  async think(state) {
    this.isThinking = true;
    this.startMoveIndex = state.serverMoveIndex || 0;
    const startRoomId = state.roomId;
    
    try {
      // 1. Initial "Human" Reaction Delay (Simulate noticing the move)
      const movedCount = state.moveHistory?.length || 0;
      let reactionMin = 1500;
      let reactionMax = 3500;

      // Reactions are faster in time pressure or simple endgames
      const remainingTotal = this.clock?.remainingMs?.[this.side] || 600000;
      const isUnderTimePressure = remainingTotal < 60000; // Less than 1 min left

      if (movedCount > 50 || isUnderTimePressure) {
        reactionMin = 800;
        reactionMax = 2000;
      }

      const reactionDelay = reactionMin + Math.random() * (reactionMax - reactionMin); 
      await new Promise(r => setTimeout(r, reactionDelay));

      // VERIFY: Still my turn after reaction delay?
      if (this.lastState?.currentPlayer !== this.side || 
          this.currentRoomId !== startRoomId || 
          (this.lastState?.serverMoveIndex || 0) !== this.startMoveIndex) {
        console.warn(`[Bot:${this.name}] Pre-analysis abort: State changed. (Room: ${this.currentRoomId === startRoomId ? 'Match' : 'Mismatch'}, Turn: ${this.lastState?.currentPlayer === this.side ? 'Match' : 'Mismatch'}, Index: ${(this.lastState?.serverMoveIndex || 0) === this.startMoveIndex ? 'Match' : 'Mismatch'})`);
        this.isThinking = false;
        return;
      }

      const fen = boardToFen(state.board, state.currentPlayer);

      // 2. Dynamic Thinking Time based on level & game progress & personality
      const levelScales = [1.0, 0.2, 0.5, 0.9, 1.3, 1.8, 2.5]; 
      let levelMultiplier = levelScales[this.level] || 1.0;

      // --- TIME MODE ADAPTATION ---
      const modeMultipliers = {
        blitz: 0.25,
        rapid: 0.6,
        standard: 1.0,
        slow: 2.0
      };
      const modeMultiplier = modeMultipliers[state.timeMode] || 1.0;
      levelMultiplier *= modeMultiplier;

      // PERSONALITY ADJUSTMENTS

      let blunderChance = (0.25 - (this.level * 0.04));
      if (blunderChance < 0.01) blunderChance = 0.01;
      
      if (this.personality === 'aggressive') {
        levelMultiplier *= 0.7;
        blunderChance *= 1.5;
      } else if (this.personality === 'defensive') {
        levelMultiplier *= 1.4;
        blunderChance *= 0.6;
      } else if (this.personality === 'chaotic') {
        levelMultiplier *= (0.4 + Math.random() * 1.8);
        blunderChance *= 2.5; 
      } else if (this.personality === 'steady') {
        levelMultiplier *= 1.3;
        blunderChance *= 0.3;
      }
      
      let minThink = 1000 * levelMultiplier;
      let maxThink = 3000 * levelMultiplier;

      if (movedCount <= 12) {
        minThink = 2000 * levelMultiplier;
        maxThink = 6000 * levelMultiplier; 
      } else if (movedCount > 12 && movedCount <= 50) {
        minThink = 6000 * levelMultiplier;
        maxThink = 18000 * levelMultiplier; 
      } else {
        minThink = 3000 * levelMultiplier;
        maxThink = 10000 * levelMultiplier;
      }

      if (Math.random() < 0.15 && !isUnderTimePressure) {
          console.log(`[Bot] ${this.personality} is entering deep thought...`);
          minThink *= 2.5;
          maxThink *= 2.2;
      }

      if (Math.random() < blunderChance) {
          minThink = 600;
          maxThink = 1500;
      }

      // --- TIME CONTROL ADAPTATION ---
      const perMoveLimit = this.clock?.perMoveDeadlineAt ? (this.clock.perMoveDeadlineAt - Date.now()) : (this.timeControl?.perMoveMs || 120000);
      
      // Hard safety margin: never think longer than 80% of remaining per-move time 
      // or leave at least 5s for total time if per-move is not tight
      const safetyMargin = 5000;
      let absoluteMax = Math.max(1000, perMoveLimit * 0.8);
      
      // If total time is very low, force even faster moves
      if (isUnderTimePressure) {
        absoluteMax = Math.min(absoluteMax, remainingTotal / 10);
      }

      let thinkTime = Math.floor(minThink + Math.random() * (maxThink - minThink));
      
      if (thinkTime > absoluteMax) {
        console.log(`[Bot] Thinking time capped by time control: ${Math.round(thinkTime/1000)}s -> ${Math.round(absoluteMax/1000)}s`);
        thinkTime = absoluteMax;
      }

      console.log(`[Bot:${this.name}] Analyzing room ${startRoomId} (FEN: ${fen})`);
      console.log(`[Bot:${this.name}] Thinking for ${Math.round(thinkTime/1000)}s...`);
      
      const bestMoveUci = await this.engine.getBestMove(fen, Math.floor(thinkTime));
      
      // FINAL VERIFY: Still my turn after engine think time?
      if (this.lastState?.currentPlayer !== this.side || 
          this.currentRoomId !== startRoomId || 
          (this.lastState?.serverMoveIndex || 0) !== this.startMoveIndex) {
        console.warn(`[Bot:${this.name}] Final abort: State changed during engine analysis. (Room: ${this.currentRoomId === startRoomId ? 'Match' : 'Mismatch'}, Turn: ${this.lastState?.currentPlayer === this.side ? 'Match' : 'Mismatch'}, Index: ${(this.lastState?.serverMoveIndex || 0) === this.startMoveIndex ? 'Match' : 'Mismatch'})`);
        this.isThinking = false;
        return;
      }

      if (bestMoveUci) {
        const move = uciToMoveCoords(bestMoveUci);
        console.log(`[Bot:${this.name}] Found move in ${startRoomId}: ${bestMoveUci}`);
        
        this.socket.emit('game:move', {
          roomId: startRoomId,
          move,
          lastServerMoveIndex: this.startMoveIndex,
        }, (res) => {
          this.isThinking = false;
          if (!res.ok) {
            console.error(`[Bot] Move rejected: ${res.error}`);
            this.sync();
          }
        });
      } else {
        this.isThinking = false;
      }
    } catch (err) {
      console.error(`[Bot] Thinking error:`, err);
      this.isThinking = false;
    }
  }

  scanLobby() {
    console.log(`[Bot] Scanning lobby for tables...`);
    this.socket.emit('lobby:list', (res) => {
      if (res.ok && res.rooms?.length > 0) {
        const available = res.rooms.find(r => {
          if (r.started || r.finished) return false;
          const hasHost = r.players.redUid || r.players.blackUid;
          if (!hasHost) return true; // Empty room
          
          // If there's a host, check if we accept invites/playing with humans
          // Note: In this simple protocol, we don't know if host is human or bot easily without more data
          // but we follow the 'acceptInvites' flag
          return this.acceptInvites;
        });
        if (available) {
          // Add a small jitter to reduce race conditions when multiple bots join the same room
          const jitter = Math.random() * 2000;
          setTimeout(() => {
            if (!this.currentRoomId) this.joinRoom(available.roomId);
          }, jitter);
          return;
        }
      }
      
      // If nothing found, create one or force create if lobby is empty
      if (this.canInvite) {
        const emptyRooms = res.rooms?.filter(r => !r.players?.redUid || !r.players?.blackUid)?.length || 0;

        // 1. If lobby is empty (0 rooms), ALWAYS create one to seed
        // 2. If lobby has rooms but fewer than 3 empty ones, 10% chance to create
        // 3. If there are already >= 3 empty rooms, DO NOT create more
        const shouldCreate = (res.rooms?.length === 0) || (Math.random() < 0.1 && emptyRooms < 3);

        if (shouldCreate) {
          this.createRoom();
          return;
        }
      }

      console.log(`[Bot] No suitable tables. Scanning again in 10s...`);
      setTimeout(() => {
          if (!this.currentRoomId) this.scanLobby();
      }, 10000);
    });
  }

  createRoom() {
    console.log(`[Bot] Creating a new table...`);
    this.socket.emit('room:create', { timeMode: 'standard', isPrivate: false }, (res) => {
      if (res.ok) {
        this.joinRoom(res.roomId);
      }
    });
  }
}

// Start bot if run directly
if (import.meta.url.includes('index.mjs')) {
    let config = {
        email: process.env.BOT_EMAIL || `bot_${Math.random().toString(36).substring(7)}@cotuong.xyz`,
        password: process.env.BOT_PASSWORD || 'bot-password-123',
        baseUrl: process.env.BASE_URL || 'https://dev.cotuong.xyz',
        pikafishPath: process.env.PIKAFISH_PATH || '/home/hoan/Pikafish/src/pikafish',
    };

    // Support for complex bot management
    if (process.env.BOT_CONFIG) {
      try {
        const jsonConfig = JSON.parse(process.env.BOT_CONFIG);
        config = { ...config, ...jsonConfig };
        console.log(`[Bot] Loaded configuration from BOT_CONFIG environment variable.`);
      } catch (err) {
        console.error('[Bot] Failed to parse BOT_CONFIG:', err.message);
      }
    }

    const bot = new XiangqiBot(config);
    bot.start();

    // Listen for graceful exit signal from BotManager
    process.on('message', (msg) => {
        if (msg === 'graceful_exit' || msg?.type === 'graceful_exit') {
            console.log(`[Bot] Received graceful exit request for ${config.name}.`);
            bot.shouldStop = true;
            // If not in a game, or game hasn't started, exit soon
            if (!bot.currentRoomId || !bot.gameStarted) {
                console.log(`[Bot] Not in an active game. Leaving room and exiting in 3s...`);
                if (bot.currentRoomId) bot.leaveRoom();
                setTimeout(() => process.exit(0), 3000);
            }
        }
    });

    // Signal handlers
    process.on('SIGTERM', () => {
        console.log(`[Bot] SIGTERM received for ${config.name}.`);
        if (bot.currentRoomId) {
            console.log(`[Bot] Currently in a game. Setting graceful stop flag.`);
            bot.shouldStop = true;
            // Wait up to 10 mins for game completion
            setTimeout(() => {
                console.log(`[Bot] Graceful stop timeout. Exiting.`);
                process.exit(0);
            }, 600000); 
        } else {
            console.log(`[Bot] Not in a game. Exiting now.`);
            process.exit(0);
        }
    });

    process.on('SIGINT', () => {
        console.log(`[Bot] SIGINT received for ${config.name}. Exiting...`);
        process.exit(0);
    });

    // Exit on parent death
    process.on('disconnect', () => {
        console.log(`[Bot] Parent disconnected for ${config.name}. Exiting...`);
        process.exit(0);
    });
}

export { XiangqiBot };
