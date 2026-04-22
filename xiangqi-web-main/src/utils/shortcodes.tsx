import React from 'react';
import { EmbeddedBoard } from '../components/EmbeddedBoard';

/**
 * Parses message text and replaces board shortcodes with EmbeddedBoard components.
 * Shortcode syntax: [board fen="..." moves="..." title="..." size="sm|md|lg"]
 */
export function parseMessageContent(text: string): (string | React.ReactNode)[] {
  if (!text) return [];

  // Regex to find: [board fen="..." moves="..." title="..." size="..."]
  // Attributes use double quotes
  const boardRegex = /\[board\s+fen="([^"]+)"(?:\s+moves="([^"]*)")?(?:\s+title="([^"]*)")?(?:\s+size="([^"]*)")?\]/g;
  
  const segments: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = boardRegex.exec(text)) !== null) {
    // text before the match
    if (match.index > lastIndex) {
      segments.push(text.substring(lastIndex, match.index));
    }

    const [, fen, moves, title, size] = match;
    
    segments.push(
      <EmbeddedBoard 
        key={`board-${match.index}`}
        fen={fen} 
        moves={moves || ''} 
        title={title || ''} 
        size={(size as 'sm' | 'md' | 'lg') || 'md'}
      />
    );

    lastIndex = boardRegex.lastIndex;
  }

  // text after the last match
  if (lastIndex < text.length) {
    segments.push(text.substring(lastIndex));
  }

  return segments;
}
