export interface EloRank {
  max: number;
  title: string;
  icon: string;
}

export function getEloRank(elo: number | undefined | null, ranksData: any): EloRank {
  const score = Number(elo ?? 1200);
  const ranks: EloRank[] = Array.isArray(ranksData) ? ranksData : [
    { max: 1099, title: 'ranks.novice', icon: '🌱' },
    { max: 1299, title: 'ranks.amateur', icon: '🥉' },
    { max: 1499, title: 'ranks.intermediate', icon: '🥈' },
    { max: 1699, title: 'ranks.expert', icon: '🥇' },
    { max: 1899, title: 'ranks.master', icon: '🏅' },
    { max: 2099, title: 'ranks.internationalMaster', icon: '💎' },
    { max: 9999, title: 'ranks.grandmaster', icon: '👑' },
  ];

  // Sort by max just in case they are out of order
  const sorted = [...ranks].sort((a, b) => a.max - b.max);
  for (const r of sorted) {
    if (score <= r.max) return r;
  }
  return sorted[sorted.length - 1] || { max: 9999, title: 'ranks.player', icon: '♟️' };
}
