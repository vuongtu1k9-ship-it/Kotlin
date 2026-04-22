import { boardToFen } from './fen';
import type { Piece, PieceSide } from '../types';

/**
 * Copies the current board state as a FEN string to the clipboard.
 */
export async function copyFenToClipboard(board: (Piece | null)[][], currentPlayer: PieceSide): Promise<string> {
  const fen = boardToFen(board, currentPlayer);
  try {
    await navigator.clipboard.writeText(fen);
    return fen;
  } catch (err) {
    throw err;
  }
}

/**
 * Captures a DOM element and downloads it as a PNG image.
 */
export async function exportElementAsImage(element: HTMLElement, fileName: string): Promise<void> {
  try {
    // Attempt to narrow the target down to the precise board container to prevent capturing surrounding whitespace.
    const targetElement = element.querySelector('.xq-board-wrap') as HTMLElement || element;

    const { domToWebp } = await import('modern-screenshot');
    const dataUrl = await domToWebp(targetElement, {
      scale: 2,
      backgroundColor: '#0f172a', // Match app background

      style: {
        borderRadius: '20px',
      }
    });
    
    const link = document.createElement('a');
    link.download = `${fileName}.webp`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    throw err;
  }
}
/**
 * Captures a sequence of board states and generates a video file.
 * (Client-side implementation using MediaRecorder)
 */
export async function exportGameAsVideo(
  options: {
    historyLength: number;
    onSeek: (index: number) => Promise<void>;
    boardElement: HTMLElement;
    fps?: number;
    fileName?: string;
    onProgress?: (current: number, total: number) => void;
    signal?: AbortSignal;
  }
): Promise<void> {
  const { historyLength, onSeek, boardElement, fileName = 'xiangqi_video', onProgress, signal } = options;
  const { domToCanvas } = await import('modern-screenshot');

  return new Promise(async (resolve, reject) => {
    try {
      if (signal?.aborted) return reject(new Error('Aborted'));

      // 1. Prepare Hidden Canvas
      const target = boardElement.querySelector('.xq-board-wrap') as HTMLElement || boardElement;
      
      // Get initial scale for ultra high quality (4x)
      const hdCanvas = await domToCanvas(target, { scale: 4 });
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = hdCanvas.width;
      captureCanvas.height = hdCanvas.height;
      const ctx = captureCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const stream = captureCanvas.captureStream(0);
      const recorder = new MediaRecorder(stream, { 
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm',
        videoBitsPerSecond: 10000000 // 10Mbps Ultra HD
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        if (signal?.aborted) {
          resolve(); 
          return;
        }
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.webm`;
        a.click();
        resolve();
      };

      recorder.start();

      // 2. Iterate through history and capture frames
      for (let i = 0; i <= historyLength; i++) {
        if (signal?.aborted) {
          recorder.stop();
          return;
        }
        
        if (onProgress) onProgress(i, historyLength);
        await onSeek(i);
        
        // Wait for UI animation (700ms + 300ms buffer)
        await new Promise(r => setTimeout(r, 1000)); 
        
        const frameCanvas = await domToCanvas(target, { scale: 4 });
        ctx.clearRect(0, 0, captureCanvas.width, captureCanvas.height);
        ctx.drawImage(frameCanvas, 0, 0);
        
        // Push frame
        (stream.getVideoTracks()[0] as any).requestFrame?.();
        
        // Brief pause to ensure frame registration
        await new Promise(r => setTimeout(r, 100));
      }

      // Add a 2s freeze at the end so the final state is clearly visible
      await new Promise(r => setTimeout(r, 2000));
      recorder.stop();
    } catch (err) {
      reject(err);
    }
  });
}
