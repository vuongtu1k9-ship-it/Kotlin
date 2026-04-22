import React, { useMemo } from 'react';
import { EmbeddedBoard } from './EmbeddedBoard';

interface RichContentRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders rich text (HTML) and parses [board] shortcodes into interactive React boards.
 * This version is ultra-resilient to whitespace/newlines breaking the "board" keyword.
 */
export const RichContentRenderer: React.FC<RichContentRendererProps> = ({ content, className = "" }) => {
  const parts = useMemo(() => {
    if (!content) return [];
    
    // 1. Normalize the entire content string
    // Replace all types of whitespace (newlines, tabs, &nbsp;) within the potential tag with standard spaces
    // But we must do it carefully to not break the split.
    // Instead of global replace, we target the [board ... ] patterns more specifically.
    
    // Normalize &nbsp; and newlines first
    let normalized = content.replace(/&nbsp;/g, ' ').replace(/[\r\n]+/g, ' ');

    // 2. Fix the "board" keyword if it was broken by whitespace (e.g. [bo ard])
    normalized = normalized.replace(/\[\s*b\s*o\s*a\s*r\s*d/gi, '[board');

    // 3. Split by board shortcode [board ...], allowing any content inside.
    return normalized.split(/(\[board[\s\S]+?\])/i);
  }, [content]);

  // Attribute extractor helper
  const getAttr = (tag: string, name: string) => {
    // Matches name="value" or name=&quot;value&quot; or name='value'
    const regex = new RegExp(`${name}\\s*=\\s*(?:"|&quot;|')([\\s\\S]*?)(?:"|&quot;|')`, 'i');
    const match = tag.match(regex);
    return match ? match[1].trim() : '';
  };

  return (
    <div className={`rich-text-content ${className}`}>
      {parts.map((part, idx) => {
        // Double check this part is a board shortcode
        const trimmed = part.trim().toLowerCase();
        const isBoard = trimmed.startsWith('[board');
        
        if (isBoard) {
          const fen = getAttr(part, 'fen');
          const moves = getAttr(part, 'moves');
          const title = getAttr(part, 'title');
          const size = getAttr(part, 'size') || 'md';

          if (fen) {
            return (
              <div key={idx} className="my-10 flex justify-center clear-both board-wrapper">
                <EmbeddedBoard 
                  fen={fen} 
                  moves={moves} 
                  title={title} 
                  size={size as any} 
                />
              </div>
            );
          }
        }
        
        if (!part) return null;
        
        return <span key={idx} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </div>
  );
};
