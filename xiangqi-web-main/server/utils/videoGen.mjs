import { generateBoardImage } from './imageGen.mjs';
import { fenToBoard, boardToFen } from './fen.mjs';
import { applyMoveToBoardInPlace, isInCheck, getMaterial } from '../moveLogic.mjs';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import os from 'os';
import { logger } from '../logger.mjs';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generates an MP4 video or GIF from a sequence of frames or initial FEN + moves.
 * Optimized for HIGH QUALITY board images.
 */
export async function generateGameVideo(input, options = {}) {
    const startTime = Date.now();
    const format = options.format || 'mp4'; 
    const width = options.width || 720; 
    const ratio = options.ratio || '16:9'; // Default to landscape
    const fps = options.fps || 0.5;
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xiangqi-video-'));
    
    // Calculate internal canvas height based on ratio for image generation
    let canvasHeight = Math.floor(width * 9 / 16);
    if (ratio === '9:16') canvasHeight = Math.floor(width * 16 / 9);
    else if (ratio === '1:1') canvasHeight = width;
    else if (ratio === '9:10') canvasHeight = Math.floor(width * 10 / 9);

    logger.info(`[VIDEO_GEN] 📂 Temp: ${tempDir} | Ratio: ${ratio} (${width}x${canvasHeight}) | Moves: ${input.moves?.length || 0}`);
    
    let frames = [];

    // --- Unified Input Handling (Game/Puzzle Simulation) ---
    if (input.staticImage) {
        // Direct buffer input support
        const duration = input.duration || 5;
        const frameCount = Math.max(1, Math.floor(duration * fps));
        for (let k = 0; k < frameCount; k++) {
            frames.push({ staticBuffer: input.staticImage });
        }
    } else if (input.initialFen && Array.isArray(input.moves)) {
        const { initialFen, moves } = input;
        let { board, sideToMove } = fenToBoard(initialFen);
        frames.push({ 
            fen: initialFen, 
            lastMove: null, 
            isCheck: isInCheck(sideToMove, board),
            material: getMaterial(board).pieceCount
        });

        for (const m of moves) {
            // 0. Support pre-computed FEN states (Legacy/External format)
            if (m.fen) {
                const fen = m.fen;
                const { board: nextBoard, sideToMove: nextSide } = fenToBoard(fen);
                board = nextBoard;
                sideToMove = nextSide;
                frames.push({
                    fen,
                    lastMove: m.move || m.lastMove || null,
                    isCheck: m.isCheck !== undefined ? m.isCheck : isInCheck(sideToMove, board),
                    material: getMaterial(board).pieceCount
                });
                continue;
            }

            let from, to;
            
            // 1. Handle nested move object: { move: { from, to } }
            if (m.move && m.move.from) {
                from = m.move.from;
                to = m.move.to;
            } 
            // 2. Handle flat object: { from, to }
            else if (m.from && m.to) {
                from = m.from;
                to = m.to;
            }
            // 3. Handle string format: "64-54" (Used in puzzles)
            else if (typeof m === 'string' && m.includes('-')) {
                const [f, t] = m.split('-');
                if (f.length >= 2 && t.length >= 2) {
                    from = { row: parseInt(f[0]), col: parseInt(f[1]) };
                    to = { row: parseInt(t[0]), col: parseInt(t[1]) };
                }
            }
            // 4. Handle UCI format: "e8d9" (Standard for engine-based games)
            else if (typeof m === 'string' && /^[a-i][0-9][a-i][0-9]$/.test(m)) {
                from = {
                    col: m.charCodeAt(0) - 'a'.charCodeAt(0),
                    row: 9 - parseInt(m[1])
                };
                to = {
                    col: m.charCodeAt(2) - 'a'.charCodeAt(0),
                    row: 9 - parseInt(m[3])
                };
            }

            // --- Simulation Step ---
            // If from/to are valid objects with row/col
            if (from && typeof from.row === 'number' && to && typeof to.row === 'number') {
                const result = applyMoveToBoardInPlace(board, from, to);
                if (result.ok) {
                    board = result.nextBoard;
                    sideToMove = sideToMove === 'red' ? 'black' : 'red';
                    const fen = boardToFen(board, sideToMove);
                    const movedStr = `${result.movedPiece?.side} ${result.movedPiece?.type}`;
                    logger.debug(`[VIDEO_GEN] Move Applied: ${movedStr} -> FEN: ${fen}`);
                    frames.push({ 
                        fen, 
                        lastMove: { from, to }, 
                        isCheck: isInCheck(sideToMove, board),
                        material: getMaterial(board).pieceCount
                    });
                } else {
                    logger.warn(`[VIDEO_GEN] ⚠️ Invalid move skipped: ${JSON.stringify(m)} | Error: ${result.error}`);
                }
            } else {
                logger.warn(`[VIDEO_GEN] ⚠️ Unrecognized move format skipped: ${JSON.stringify(m)}`);
            }
        }
    } else if (Array.isArray(input)) {
        frames = input;
    }

    try {
        // Ensure minimum duration (especially for TikTok/Shorts)
        if (frames.length === 1) {
            // Repeat the single frame 60 times to get 60s at 1fps
            const lastFrame = frames[0];
            for (let k = 0; k < 59; k++) frames.push(lastFrame);
        } else if (frames.length > 1) {
            // Freeze at the end for 6 seconds
            const lastFrame = frames[frames.length - 1];
            for (let k = 0; k < 6; k++) frames.push(lastFrame);
        }


        logger.info(`[VIDEO_GEN] 🎬 Starting HIGH QUALITY ${format} generation for ${frames.length} frames`);
        
        sharp.cache({ items: 200, memory: 256 }); 

        // --- Performance Session Optimization ---
        // Pre-initialize static components to be shared across ALL frames in this video
        const pieceCache = new Map();
        
        // Calculate board dimensions once
        const canvasWidth = Math.round(width);
        let canvasHeight = Math.floor(canvasWidth * 9 / 16);
        if (ratio === '9:16') canvasHeight = Math.floor(canvasWidth * 16 / 9);
        else if (ratio === '1:1') canvasHeight = canvasWidth;
        else if (ratio === '9:10') canvasHeight = Math.floor(canvasWidth * 10 / 9);

        // Pre-render the static background and board once
        const backgroundBase = await sharp({
            create: { width: canvasWidth, height: canvasHeight, channels: 4, background: "#000000" }
        }).webp().toBuffer();

        // board dimensions calculation matches imageGen.mjs logic
        const visualMargin = Math.floor(Math.min(canvasWidth, canvasHeight) * 0.05);
        const maxBoardWidth = canvasWidth - (visualMargin * 2);
        const maxBoardHeight = canvasHeight - (visualMargin * 2);
        let boardWidth, boardHeight;
        if (maxBoardWidth / maxBoardHeight > 9 / 10) {
            boardHeight = Math.round(maxBoardHeight);
            boardWidth = Math.round(boardHeight * 9 / 10);
        } else {
            boardWidth = Math.round(maxBoardWidth);
            boardHeight = Math.round(boardWidth * 10 / 9);
        }

        const boardBase = await sharp({
            create: {
                width: boardWidth,
                height: boardHeight,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        }).composite([{
            input: Buffer.from(`
                <svg width="${boardWidth}" height="${boardHeight}" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="none" />
                </svg>
            `), // Placeholder to trigger SVG logic in imageGen if needed, or we just pre-create it
        }]).webp().toBuffer(); 
        // Actually, createBoardSVG is private to imageGen.mjs. 
        // Let's just pass null and let imageGen create it once and return it for reuse?
        // No, let's just optimize imageGen to create it once if not provided.
        
        let sessionBoardBase = null;
        const renderStart = Date.now();

        const concurrency = 2; // Conservative but fast due to piece-level pre-composing
        for (let i = 0; i < frames.length; i += concurrency) {
            const chunk = frames.slice(i, i + concurrency);
            await Promise.all(chunk.map(async (frame, chunkIdx) => {
                const globalIdx = i + chunkIdx;
                if (frame.staticBuffer) {
                    const framePath = path.join(tempDir, `frame_${String(globalIdx).padStart(5, '0')}.webp`);
                    await fs.writeFile(framePath, frame.staticBuffer);
                    return;
                }

                const fen = typeof frame === 'string' ? frame : frame.fen;
                const lastMove = typeof frame === 'object' ? frame.lastMove : null;
                const isCheck = typeof frame === 'object' ? frame.isCheck : false;
                const pieceCount = typeof frame === 'object' ? frame.material : 'N/A';

                if (globalIdx % 10 === 0 || frames.length < 20) {
                    logger.info(`[VIDEO_GEN] 📸 Rendering frame ${globalIdx + 1}/${frames.length} (FEN: ${fen} | Pieces: ${pieceCount})`);
                }

                const buf = await generateBoardImage(fen, { 
                    width: width, 
                    ratio: ratio, 
                    lastMove, 
                    isCheck,
                    pieceCache,
                    backgroundBase
                });

                const framePath = path.join(tempDir, `frame_${String(globalIdx).padStart(5, '0')}.webp`);
                await fs.writeFile(framePath, buf);
            }));
        }

        const renderDuration = ((Date.now() - renderStart) / 1000).toFixed(1);
        logger.info(`[VIDEO_GEN] 📸 Finished rendering ${frames.length} frames in ${renderDuration}s. Starting FFmpeg stitch...`);

        // --- Audio Integration ---
        const assetsDir = path.join(process.cwd(), 'public', 'assets');
        let musicPath = null;
        try {
            const files = await fs.readdir(assetsDir);
            const mp3s = files.filter(f => f.endsWith('.mp3'));
            if (mp3s.length > 0) {
                const randomMp3 = mp3s[Math.floor(Math.random() * mp3s.length)];
                musicPath = path.join(assetsDir, randomMp3);
                logger.info(`[VIDEO_GEN] 🎵 Using background music: ${randomMp3}`);
            }
        } catch (e) {
            logger.warn('[VIDEO_GEN] ⚠️ No music found in public/assets, generating silent video.');
        }

        const outputPath = path.join(tempDir, `output.${format}`);
        const vcodec = format === 'webm' ? 'libvpx-vp9' : 'libx264';
        const acodec = format === 'webm' ? 'libopus' : 'aac';
        
        const videoDuration = frames.length / fps;
        const fadeOutDuration = 2; // 2 seconds fade out
        const fadeOutStart = Math.max(0, videoDuration - fadeOutDuration);

        const args = [
            '-y', 
            '-framerate', String(fps), 
            '-i', path.join(tempDir, 'frame_%05d.webp')
        ];

        if (musicPath) {
            args.push('-stream_loop', '-1', '-i', musicPath);
        }

        args.push(
            '-c:v', vcodec, 
            '-preset', 'ultrafast', 
            '-crf', '23', // Better quality/size balance than 0
            '-threads', '4'
        );

        if (options.bitrate) {
            args.push('-b:v', options.bitrate, '-minrate', options.bitrate, '-maxrate', options.bitrate, '-bufsize', options.bitrate);
        }

        if (format === 'mp4') {
            args.push('-pix_fmt', 'yuv420p');
        }

        // Filters: padding + audio mapping/fading
        let filterComplex = `pad=ceil(iw/2)*2:ceil(ih/2)*2`;
        if (musicPath) {
            args.push('-map', '0:v:0', '-map', '1:a:0');
            args.push('-af', `afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}`);
            args.push('-shortest');
        }

        args.push('-vf', filterComplex, outputPath);

        logger.info(`[VIDEO_GEN] 🎞️ Executing FFmpeg stitch with audio...`);
        await new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', args);
            
            ffmpeg.stderr.on('data', (data) => {
                // FFmpeg logs to stderr by default
                const msg = data.toString();
                if (msg.includes('Error')) logger.error(`[FFMPEG] ${msg}`);
            });

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    logger.info(`[VIDEO_GEN] ✨ FFmpeg process completed successfully.`);
                    resolve();
                } else {
                    logger.error(`[VIDEO_GEN] ❌ FFmpeg failed with code ${code}`);
                    reject(new Error('FFmpeg failed'));
                }
            });
        });

        const videoBuffer = await fs.readFile(outputPath);
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
        const videoSizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(2);
        
        logger.info(`[VIDEO_GEN] ✅ Video generated successfully!`);
        logger.info(`[VIDEO_GEN] 📊 Stats: ${frames.length} frames | Time: ${totalDuration}s (Render: ${renderDuration}s) | Size: ${videoSizeMB} MB`);
        
        await fs.rm(tempDir, { recursive: true, force: true });
        logger.info(`[VIDEO_GEN] 🧹 Cleaned up temp directory: ${tempDir}`);
        
        return videoBuffer;
    } catch (err) {
        if (tempDir) {
            await fs.rm(tempDir, { recursive: true, force: true }).catch(rmErr => {
                logger.error(`[VIDEO_GEN] ⚠️ Cleanup failed for ${tempDir}:`, rmErr.message);
            });
        }
        throw err;
    }
}

export async function generateBoardVideo(frames, outputPath, options = {}) {
    const buffer = await generateGameVideo(frames, options);
    await fs.writeFile(outputPath, buffer);
    logger.info(`[VIDEO_GEN] 💾 Video permanently saved to: ${outputPath}`);
    return outputPath;
}
