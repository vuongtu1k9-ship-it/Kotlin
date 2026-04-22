export function fmtMs(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const s = Math.max(0, Math.floor((ms % 60000) / 1000));
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
