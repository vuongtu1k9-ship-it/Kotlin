import { logger } from './logger';

type SoundEvent = 'move' | 'capture' | 'check' | 'win' | 'loss' | 'draw' | 'start';

export function playGameSound(event: SoundEvent) {
  const voicePack = localStorage.getItem('xq:voice_pack') || 'vi';
  if (voicePack === 'none') return;

  const order = [voicePack, 'vi', 'en']; // Fallback order
  
  // In a real app, we'd pre-load these or use a manager.
  // For now, we'll create a new Audio object.
  const play = (lang: string) => {
    const src = `/sounds/${lang}/${event}.mp3`;
    const audio = new Audio(src);
    audio.volume = 0.6;
    
    audio.play().catch(err => {
      logger.debug(`[Audio] Failed to play ${src}:`, err.message);
      // If the primary lang fails, try fallback if it's not already the fallback
      const currentIndex = order.indexOf(lang);
      if (currentIndex < order.length - 1) {
        play(order[currentIndex + 1]);
      }
    });
  };

  play(voicePack);
}
