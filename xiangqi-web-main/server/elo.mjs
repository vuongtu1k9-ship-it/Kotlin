export function expectedScore(rA, rB) {
  return 1 / (1 + 10 ** ((rB - rA) / 400));
}

export function kFactor(gamesPlayed = 0) {
  return gamesPlayed < 30 ? 40 : 20;
}

export function updateElo({ rA, rB, sA, gamesA = 0, gamesB = 0 }) {
  const eA = expectedScore(rA, rB);
  const eB = 1 - eA;
  const kA = kFactor(gamesA);
  const kB = kFactor(gamesB);
  const sB = 1 - sA;
  const nextA = Math.round(rA + kA * (sA - eA));
  const nextB = Math.round(rB + kB * (sB - eB));
  return { nextA, nextB, eA, eB, kA, kB };
}
