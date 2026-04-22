import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { logger } from '../logger.mjs';

sharp.cache({ items: 50, memory: 100 }); // Limited cache to balance speed and memory

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_PATH = path.join(__dirname, '../../public/pieces');

const debugLog = async (msg) => {
    try {
        await fs.appendFile('/tmp/image-gen.log', `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) { }
};

const PIECE_MAP = {
    'k': 'black-general.svg', 'a': 'black-advisor.svg', 'b': 'black-elephant.svg',
    'n': 'black-horse.svg', 'r': 'black-chariot.svg', 'c': 'black-cannon.svg',
    'p': 'black-soldier.svg',
    'K': 'red-general.svg', 'A': 'red-advisor.svg', 'B': 'red-elephant.svg',
    'N': 'red-horse.svg', 'R': 'red-chariot.svg', 'C': 'red-cannon.svg',
    'P': 'red-soldier.svg'
};

// --- 🚀 VISUALLY NEUTRAL OPTIMIZATION: In-Memory Asset Cache ---
const PIECE_BUFFERS = new Map();
const BOARD_CACHE = new Map(); // Cache boardBase by dimensions

async function getPieceBuffer(char) {
    if (PIECE_BUFFERS.size === 0) {
        for (const [key, file] of Object.entries(PIECE_MAP)) {
            try {
                const buf = await fs.readFile(path.join(ASSETS_PATH, file));
                PIECE_BUFFERS.set(key, buf);
            } catch (e) {
                logger.error(`[IMAGE_GEN] Failed to preload asset: ${file}`, e.message);
            }
        }
        logger.info(`[IMAGE_GEN] 🎨 All piece assets preloaded into memory (${PIECE_BUFFERS.size} items)`);
    }
    return PIECE_BUFFERS.get(char);
}

function createBoardSVG(width, height) {
    const boardPadding = Math.min(width, height) * 0.05;
    const innerWidth = width - 2 * boardPadding;
    const innerHeight = height - 2 * boardPadding;
    const cellWidth = innerWidth / 8;
    const cellHeight = innerHeight / 9;

    const bgFrame = "#1a1a1a";
    const lineColor = "#bd9e6b";
    const lineSecondary = "#8b6b23";

    let grid = '';
    for (let i = 0; i < 10; i++) {
        const y = boardPadding + i * cellHeight;
        grid += `<line x1="${boardPadding}" y1="${y}" x2="${width - boardPadding}" y2="${y}" stroke="${lineColor}" stroke-width="1.5" opacity="0.4"/>`;
    }
    for (let i = 0; i < 9; i++) {
        const x = boardPadding + i * cellWidth;
        grid += `<line x1="${x}" y1="${boardPadding}" x2="${x}" y2="${boardPadding + 4 * cellHeight}" stroke="${lineColor}" stroke-width="1.5" opacity="0.4"/>`;
        grid += `<line x1="${x}" y1="${boardPadding + 5 * cellHeight}" x2="${x}" y2="${height - boardPadding}" stroke="${lineColor}" stroke-width="1.5" opacity="0.4"/>`;
    }
    grid += `<line x1="${boardPadding}" y1="${boardPadding + 4 * cellHeight}" x2="${boardPadding}" y2="${boardPadding + 5 * cellHeight}" stroke="${lineColor}" stroke-width="1.5" opacity="0.4"/>`;
    grid += `<line x1="${width - boardPadding}" y1="${boardPadding + 4 * cellHeight}" x2="${width - boardPadding}" y2="${boardPadding + 5 * cellHeight}" stroke="${lineColor}" stroke-width="1.5" opacity="0.3"/>`;

    const palaces = [
        [boardPadding + 3 * cellWidth, boardPadding, boardPadding + 5 * cellWidth, boardPadding + 2 * cellHeight],
        [boardPadding + 5 * cellWidth, boardPadding, boardPadding + 3 * cellWidth, boardPadding + 2 * cellHeight],
        [boardPadding + 3 * cellWidth, height - boardPadding - 2 * cellHeight, boardPadding + 5 * cellWidth, height - boardPadding],
        [boardPadding + 5 * cellWidth, height - boardPadding - 2 * cellHeight, boardPadding + 3 * cellWidth, height - boardPadding]
    ];
    palaces.forEach(([x1, y1, x2, y2]) => {
        grid += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${lineColor}" stroke-width="1.0" opacity="0.3"/>`;
    });

    const drawCross = (r, c) => {
        const x = boardPadding + c * cellWidth;
        const y = boardPadding + r * cellHeight;
        const s = cellWidth * 0.12;
        const p = cellWidth * 0.04;
        let res = '';
        if (c > 0) res += `<line x1="${x - p - s}" y1="${y - p}" x2="${x - p}" y2="${y - p}" stroke="${lineColor}" stroke-width="1.5" opacity="0.6"/><line x1="${x - p}" y1="${y - p - s}" x2="${x - p}" y2="${y - p}" stroke="${lineColor}" stroke-width="1.5" opacity="0.6"/>`;
        if (c > 0) res += `<line x1="${x - p - s}" y1="${y + p}" x2="${x - p}" y2="${y + p}" stroke="${lineColor}" stroke-width="1.5" opacity="0.6"/><line x1="${x - p}" y1="${y + p + s}" x2="${x - p}" y2="${y + p}" stroke="${lineColor}" stroke-width="1.5" opacity="0.6"/>`;
        if (c < 8) res += `<line x1="${x + p + s}" y1="${y - p}" x2="${x + p}" y2="${y - p}" stroke="${lineColor}" stroke-width="1.5" opacity="0.6"/><line x1="${x + p}" y1="${y - p - s}" x2="${x + p}" y2="${y - p}" stroke="${lineColor}" stroke-width="1.5" opacity="0.6"/>`;
        if (c < 8) res += `<line x1="${x + p + s}" y1="${y + p}" x2="${x + p}" y2="${y + p}" stroke="${lineColor}" stroke-width="1.5" opacity="0.6"/><line x1="${x + p}" y1="${y + p + s}" x2="${x + p}" y2="${y + p}" stroke="${lineColor}" stroke-width="1.5" opacity="0.6"/>`;
        return res;
    };
    const marks = [[2, 1], [2, 7], [7, 1], [7, 7], [3, 0], [3, 2], [3, 4], [3, 6], [3, 8], [6, 0], [6, 2], [6, 4], [6, 6], [6, 8]];
    marks.forEach(([r, c]) => grid += drawCross(r, c));

    const brandText = `<text x="${width / 2}" y="${height / 2}" font-family="Noto Sans, sans-serif" font-size="${cellHeight * 0.45}" font-weight="900" fill="${lineSecondary}" opacity="0.2" text-anchor="middle" dominant-baseline="middle" letter-spacing="0.3em">COTUONG.XYZ</text>`;

    return Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="boardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#3d2b1f;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2b1d14;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="${bgFrame}" />
        <rect x="2" y="2" width="${width - 4}" height="${height - 4}" fill="none" stroke="#6b6b6b" stroke-width="4.0" opacity="0.9"/>
        <rect x="${boardPadding / 2}" y="${boardPadding / 2}" width="${width - boardPadding}" height="${height - boardPadding}" fill="url(#boardGrad)" rx="2" ry="2"/>
        ${grid}
        ${brandText}
      </svg>
    `);
}

export async function generateBoardImage(fen, options = {}) {
    // --- Pre-render static base components if provided in session ---
    let boardBase = options.boardBase;
    let backgroundBase = options.backgroundBase;
    const DEFAULT_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
    if (!fen || typeof fen !== 'string' || !fen.includes('/')) {
        logger.warn(`[IMAGE_GEN] Invalid FEN provided, using default: ${fen}`);
        fen = DEFAULT_FEN;
    }

    await debugLog(`Starting image gen for FEN: ${fen}`);

    // --- 📐 Sizing Logic ---
    let canvasWidth = Math.round(options.width || 1200);
    let canvasHeight = Math.round(options.height || (canvasWidth * 0.525)); // Default ~1.91:1 (OG)

    // Apply aspect ratio presets
    if (options.ratio === '9:16') {
        canvasHeight = Math.floor(canvasWidth * 16 / 9);
    } else if (options.ratio === '1:1') {
        canvasHeight = canvasWidth;
    } else if (options.ratio === '9:10') {
        canvasHeight = Math.floor(canvasWidth * 10 / 9);
    } else if (options.ratio === '16:9') {
        canvasHeight = Math.floor(canvasWidth * 9 / 16);
    } else if (options.height) {
        canvasHeight = options.height;
    }

    const visualMargin = Math.floor(Math.min(canvasWidth, canvasHeight) * 0.05);
    const maxBoardWidth = canvasWidth - (visualMargin * 2);
    const maxBoardHeight = canvasHeight - (visualMargin * 2);

    let boardWidth, boardHeight;
    // Board is 9 cols wide, 10 rows high. Aspect ratio 9/10 = 0.9
    if (maxBoardWidth / maxBoardHeight > 9 / 10) {
        boardHeight = Math.round(maxBoardHeight);
        boardWidth = Math.round(boardHeight * 9 / 10);
    } else {
        boardWidth = Math.round(maxBoardWidth);
        boardHeight = Math.round(boardWidth * 10 / 9);
    }

    const boardPadding = Math.min(boardWidth, boardHeight) * 0.05;
    const innerWidth = boardWidth - 2 * boardPadding;
    const innerHeight = boardHeight - 2 * boardPadding;
    const cellWidth = innerWidth / 8;
    const cellHeight = innerHeight / 9;
    const pieceBaseScale = 0.98;
    const pieceSvgScale = 0.88;

    const offsetX = Math.floor((canvasWidth - boardWidth) / 2);
    const offsetY = Math.floor((canvasHeight - boardHeight) / 2);

    const boardCacheKey = `${boardWidth}x${boardHeight}`;
    if (!boardBase) {
        if (BOARD_CACHE.has(boardCacheKey)) {
            boardBase = BOARD_CACHE.get(boardCacheKey);
        } else {
            boardBase = createBoardSVG(boardWidth, boardHeight);
            BOARD_CACHE.set(boardCacheKey, boardBase);
        }
    }
    const [position] = fen.split(' ');
    const rows = position.split('/');
    const composites = [];

    const lastMove = options.lastMove;
    if (lastMove && lastMove.from && lastMove.to) {
        const highlightColor = "rgba(234, 179, 8, 0.35)";
        const highlightStroke = "rgba(234, 179, 8, 0.6)";
        const hsSmall = Math.floor(Math.min(cellWidth, cellHeight) * 0.75);
        const hsLarge = Math.floor(Math.min(cellWidth, cellHeight) * 1.15);
        const createCircleSvg = (size, strokeW, dash = "") => Buffer.from(`
            <svg width="${size}" height="${size}">
                <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="${highlightColor}" stroke="${highlightStroke}" stroke-width="${strokeW}" ${dash ? `stroke-dasharray="${dash}"` : ''} />
            </svg>
        `);
        composites.push({ input: createCircleSvg(hsSmall, 3, "5,5"), top: Math.floor(offsetY + boardPadding + lastMove.from.row * cellHeight - hsSmall / 2), left: Math.floor(offsetX + boardPadding + lastMove.from.col * cellWidth - hsSmall / 2) });
        composites.push({ input: createCircleSvg(hsLarge, 4), top: Math.floor(offsetY + boardPadding + lastMove.to.row * cellHeight - hsLarge / 2), left: Math.floor(offsetX + boardPadding + lastMove.to.col * cellWidth - hsLarge / 2) });
    }

    if (options.isCheck) {
        const badgeW = Math.floor(boardWidth * 0.55);
        const badgeH = Math.floor(cellHeight * 0.85);
        const checkBadge = Buffer.from(`
            <svg width="${badgeW}" height="${badgeH}">
                <rect x="0" y="0" width="${badgeW}" height="${badgeH}" rx="${badgeH / 2}" fill="#dc2626" stroke="#ffffff" stroke-width="3" />
                <text x="50%" y="50%" font-family="Noto Sans, sans-serif" font-size="${badgeH * 0.5}" font-weight="900" fill="white" text-anchor="middle" dominant-baseline="central" letter-spacing="0.1em">CHIẾU TƯỚNG</text>
            </svg>
        `);
        composites.push({ input: checkBadge, top: Math.floor(offsetY + boardPadding + 4.5 * cellHeight - badgeH / 2), left: Math.floor(offsetX + (boardWidth - badgeW) / 2) });
    }

    for (let r = 0; r < 10; r++) {
        let c = 0;
        const rowStr = rows[r];
        if (!rowStr) continue;
        for (let i = 0; i < rowStr.length; i++) {
            const char = rowStr[i];
            if (/[0-9]/.test(char)) {
                c += parseInt(char, 10);
            } else if (PIECE_MAP[char]) {
                const posX = offsetX + boardPadding + c * cellWidth;
                const posY = offsetY + boardPadding + r * cellHeight;

                const baseSize = Math.floor(Math.min(cellWidth, cellHeight) * pieceBaseScale);
                const svgSize = Math.floor(baseSize * pieceSvgScale);
                const cacheKey = `full_${char}_${baseSize}_${svgSize}`;

                let pieceFullBuffer;
                if (options.pieceCache && options.pieceCache.has(cacheKey)) {
                    pieceFullBuffer = options.pieceCache.get(cacheKey);
                } else {
                    // Create the full piece (Shadow + Disc + Icon)
                    const shadow = Buffer.from(`<svg width="${baseSize + 8}" height="${baseSize + 8}"><circle cx="${Math.round(baseSize / 2 + 4)}" cy="${Math.round(baseSize / 2 + 6)}" r="${Math.round(baseSize / 2)}" fill="black" opacity="0.35"/></svg>`);
                    const disc = Buffer.from(`<svg width="${baseSize}" height="${baseSize}">
                        <defs>
                            <radialGradient id="pieceGrad" cx="42%" cy="42%" r="50%">
                                <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#f2f2f2;stop-opacity:1" />
                            </radialGradient>
                        </defs>
                        <circle cx="${Math.round(baseSize / 2)}" cy="${Math.round(baseSize / 2)}" r="${Math.round(baseSize / 2 - 2)}" fill="url(#pieceGrad)" stroke="#c4a484" stroke-width="3" />
                    </svg>`);

                    const pieceBuffer = await getPieceBuffer(char);
                    const resizedPiece = await sharp(pieceBuffer).resize(svgSize, svgSize).toBuffer();

                    // Compose them together once
                    pieceFullBuffer = await sharp(shadow)
                        .composite([
                            { input: disc, top: 4, left: 4 },
                            { input: resizedPiece, top: 4 + Math.floor((baseSize - svgSize) / 2), left: 4 + Math.floor((baseSize - svgSize) / 2) }
                        ])
                        .png()
                        .toBuffer();

                    if (options.pieceCache) {
                        options.pieceCache.set(cacheKey, pieceFullBuffer);
                    }
                }

                composites.push({
                    input: pieceFullBuffer,
                    top: Math.floor(posY - baseSize / 2 - 4),
                    left: Math.floor(posX - baseSize / 2 - 4)
                });

                c++;
            }
        }
    }

    const compositesCount = composites.length;
    logger.debug(`[IMAGE_GEN] 🏗️  Building image with ${compositesCount} composites for FEN: ${fen}`);

    try {
        if (!backgroundBase) {
            backgroundBase = await sharp({
                create: { width: canvasWidth, height: canvasHeight, channels: 4, background: "#000000" }
            }).webp().toBuffer();
        }

        const result = await sharp(backgroundBase)
            .composite([{ input: boardBase, top: offsetY, left: offsetX }, ...composites])
            .webp({ quality: 85, effort: 2 }) // Slightly higher quality, lower effort for speed
            .toBuffer();
            
        return result;
    } catch (err) {
        await debugLog(`ERROR: ${err.message}\nStack: ${err.stack}`);
        logger.error(`[IMAGE_GEN] ❌ Sharp processing failed for FEN: ${fen}`, err.message);
        throw err;
    }
}
