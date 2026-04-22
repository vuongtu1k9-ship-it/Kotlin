export type TimeModeKey = 'blitz' | 'rapid' | 'standard' | 'slow';

export type TimeMode = {
  key: TimeModeKey;
  label: string;
  totalMs: number; // per side
  perMoveMs: number;
};

export const TIME_MODES: TimeMode[] = [
  { key: 'blitz', label: 'Chớp', totalMs: 5 * 60_000, perMoveMs: 30_000 },
  { key: 'rapid', label: 'Nhanh', totalMs: 15 * 60_000, perMoveMs: 60_000 },
  { key: 'standard', label: 'Tiêu chuẩn', totalMs: 30 * 60_000, perMoveMs: 3 * 60_000 },
  { key: 'slow', label: 'Chậm', totalMs: 60 * 60_000, perMoveMs: 5 * 60_000 },
];

export function getTimeMode(key?: string | null): TimeMode {
  return TIME_MODES.find((m) => m.key === key) || TIME_MODES.find((m) => m.key === 'standard')!;
}
