import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const piecePaths = [
    path.join(__dirname, '../../public/pieces'),
    path.join(__dirname, '../public/pieces'),
    path.join(process.cwd(), 'public', 'pieces')
];
let ASSETS_PATH = piecePaths[0];
for (const p of piecePaths) {
  if (fs.existsSync(p)) {
    ASSETS_PATH = p;
    break;
  }
}

const PIECE_MAP = {
    'k': 'black-general.svg', 'a': 'black-advisor.svg', 'b': 'black-elephant.svg',
    'n': 'black-horse.svg',   'r': 'black-chariot.svg', 'c': 'black-cannon.svg',
    'p': 'black-soldier.svg',
    'K': 'red-general.svg',   'A': 'red-advisor.svg',   'B': 'red-elephant.svg',
    'N': 'red-horse.svg',     'R': 'red-chariot.svg',   'C': 'red-cannon.svg',
    'P': 'red-soldier.svg'
};

function createBoardSVG(width, height) {
    const boardPadding = Math.min(width, height) * 0.05;
    const innerWidth = width - 2 * boardPadding;
    const innerHeight = height - 2 * boardPadding;
    const cellWidth = innerWidth / 8;
    const cellHeight = innerHeight / 9;

    const bgBoard = "#f5deb3";
    const bgFrame = "#5c4033";
    const lineColor = "#8b4513";
    const lineSecondary = "#8b4513";

    let grid = '';
    for (let i = 0; i < 10; i++) {
        const y = boardPadding + i * cellHeight;
        grid += `<line x1="${boardPadding}" y1="${y}" x2="${width - boardPadding}" y2="${y}" stroke="${lineColor}" stroke-width="1.2" opacity="0.5"/>`;
    }
    for (let i = 0; i < 9; i++) {
        const x = boardPadding + i * cellWidth;
        grid += `<line x1="${x}" y1="${boardPadding}" x2="${x}" y2="${boardPadding + 4 * cellHeight}" stroke="${lineColor}" stroke-width="1.2" opacity="0.5"/>`;
        grid += `<line x1="${x}" y1="${boardPadding + 5 * cellHeight}" x2="${x}" y2="${height - boardPadding}" stroke="${lineColor}" stroke-width="1.2" opacity="0.5"/>`;
    }
    grid += `<line x1="${boardPadding}" y1="${boardPadding + 4 * cellHeight}" x2="${boardPadding}" y2="${boardPadding + 5 * cellHeight}" stroke="${lineColor}" stroke-width="1.2" opacity="0.5"/>`;
    grid += `<line x1="${width - boardPadding}" y1="${boardPadding + 4 * cellHeight}" x2="${width - boardPadding}" y2="${boardPadding + 5 * cellHeight}" stroke="${lineColor}" stroke-width="1.2" opacity="0.5"/>`;

    const palaces = [
        [boardPadding + 3 * cellWidth, boardPadding, boardPadding + 5 * cellWidth, boardPadding + 2 * cellHeight],
        [boardPadding + 5 * cellWidth, boardPadding, boardPadding + 3 * cellWidth, boardPadding + 2 * cellHeight],
        [boardPadding + 3 * cellWidth, height - boardPadding - 2 * cellHeight, boardPadding + 5 * cellWidth, height - boardPadding],
        [boardPadding + 5 * cellWidth, height - boardPadding - 2 * cellHeight, boardPadding + 3 * cellWidth, height - boardPadding]
    ];
    palaces.forEach(([x1, y1, x2, y2]) => {
        grid += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${lineColor}" stroke-width="0.8" opacity="0.4"/>`;
    });

    const drawCross = (r, c) => {
        const x = boardPadding + c * cellWidth;
        const y = boardPadding + r * cellHeight;
        const s = cellWidth * 0.12;
        const p = cellWidth * 0.04;
        let res = '';
        if (c > 0) res += `<line x1="${x-p-s}" y1="${y-p}" x2="${x-p}" y2="${y-p}" stroke="${lineColor}" stroke-width="0.8" opacity="0.4"/><line x1="${x-p}" y1="${y-p-s}" x2="${x-p}" y2="${y-p}" stroke="${lineColor}" stroke-width="0.8" opacity="0.4"/>`;
        if (c > 0) res += `<line x1="${x-p-s}" y1="${y+p}" x2="${x-p}" y2="${y+p}" stroke="${lineColor}" stroke-width="0.8" opacity="0.4"/><line x1="${x-p}" y1="${y+p+s}" x2="${x-p}" y2="${y+p}" stroke="${lineColor}" stroke-width="0.8" opacity="0.4"/>`;
        if (c < 8) res += `<line x1="${x+p+s}" y1="${y-p}" x2="${x+p}" y2="${y-p}" stroke="${lineColor}" stroke-width="0.8" opacity="0.4"/><line x1="${x+p}" y1="${y-p-s}" x2="${x+p}" y2="${y-p}" stroke="${lineColor}" stroke-width="0.8" opacity="0.4"/>`;
        if (c < 8) res += `<line x1="${x+p+s}" y1="${y+p}" x2="${x+p}" y2="${y+p}" stroke="${lineColor}" stroke-width="0.8" opacity="0.4"/><line x1="${x+p}" y1="${y+p+s}" x2="${x+p}" y2="${y+p}" stroke="${lineColor}" stroke-width="0.8" opacity="0.4"/>`;
        return res;
    };
    const marks = [[2,1],[2,7],[7,1],[7,7],[3,0],[3,2],[3,4],[3,6],[3,8],[6,0],[6,2],[6,4],[6,6],[6,8]];
    marks.forEach(([r,c]) => grid += drawCross(r,c));

    const brandText = `<text x="${width / 2}" y="${height / 2}" font-family="serif" font-size="${cellHeight * 0.4}" font-weight="900" fill="${lineSecondary}" opacity="0.25" text-anchor="middle" dominant-baseline="middle" letter-spacing="0.3em">COTUONG.XYZ</text>`;

    return Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgFrame}" />
        <rect x="2" y="2" width="${width-4}" height="${height-4}" fill="none" stroke="#d4af37" stroke-width="0.5" opacity="0.4"/>
        <rect x="${boardPadding/2}" y="${boardPadding/2}" width="${width-boardPadding}" height="${height-boardPadding}" fill="${bgBoard}" rx="4" ry="4"/>
        ${grid}
        ${brandText}
      </svg>
    `);
}

export async function generateBoardImage(fen, options = {}) {
    const canvasWidth = options.width || 600;
    const canvasHeight = options.height || Math.floor(options.width * 10 / 9) || 666;

    let boardWidth, boardHeight;
    if (canvasWidth / canvasHeight > 9 / 10) {
        boardHeight = canvasHeight;
        boardWidth = Math.floor(boardHeight * 9 / 10);
    } else {
        boardWidth = canvasWidth;
        boardHeight = Math.floor(boardWidth * 10 / 9);
    }

    const boardPadding = Math.min(boardWidth, boardHeight) * 0.05;
    const innerWidth = boardWidth - 2 * boardPadding;
    const innerHeight = boardHeight - 2 * boardPadding;
    const cellWidth = innerWidth / 8;
    const cellHeight = innerHeight / 9;
    const pieceBaseScale = 0.96;
    const pieceSvgScale = 0.85;
    const offsetX = Math.floor((canvasWidth - boardWidth) / 2);
    const offsetY = Math.floor((canvasHeight - boardHeight) / 2);

    const boardBase = createBoardSVG(boardWidth, boardHeight);
    const [position] = fen.split(' ');
    const rows = position.split('/');
    const composites = [];

    for (let r = 0; r < 10; r++) {
        let c = 0;
        const rowStr = rows[r];
        if (!rowStr) continue;
        for (let i = 0; i < rowStr.length; i++) {
            const char = rowStr[i];
            if (/[0-9]/.test(char)) {
                c += parseInt(char, 10);
            } else if (PIECE_MAP[char]) {
                const baseSize = Math.floor(Math.min(cellWidth, cellHeight) * pieceBaseScale);
                const svgSize = Math.floor(baseSize * pieceSvgScale);
                const posX = offsetX + boardPadding + c * cellWidth;
                const posY = offsetY + boardPadding + r * cellHeight;

                const shadow = Buffer.from(`<svg width="${baseSize+4}" height="${baseSize+4}"><circle cx="${baseSize/2+2}" cy="${baseSize/2+3}" r="${baseSize/2}" fill="black" opacity="0.3"/></svg>`);
                const disc = Buffer.from(`<svg width="${baseSize}" height="${baseSize}"><defs><radialGradient id="grad" cx="40%" cy="40%" r="50%"><stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" /><stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1" /></radialGradient></defs><circle cx="${baseSize/2}" cy="${baseSize/2}" r="${baseSize/2-1.5}" fill="url(#grad)" stroke="#d2b48c" stroke-width="1.5" /></svg>`);

                composites.push({ input: shadow, top: Math.floor(posY - baseSize/2 - 2), left: Math.floor(posX - baseSize/2 - 2) });
                composites.push({ input: disc, top: Math.floor(posY - baseSize/2), left: Math.floor(posX - baseSize/2) });
                composites.push({ input: await sharp(path.join(ASSETS_PATH, PIECE_MAP[char])).resize(svgSize, svgSize).toBuffer(), top: Math.floor(posY - svgSize / 2), left: Math.floor(posX - svgSize / 2) });
                c++;
            }
        }
    }

    const background = await sharp({ create: { width: canvasWidth, height: canvasHeight, channels: 4, background: "#1a0f0f" } }).webp().toBuffer();
    return sharp(background).composite([{ input: boardBase, top: offsetY, left: offsetX }, ...composites]).webp({ quality: 80 }).toBuffer();
}
