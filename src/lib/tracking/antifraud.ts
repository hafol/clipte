// Lightweight anti-fraud checks run on every new view reading.
// They only FLAG clips for a moderator — nothing is rejected automatically.

export type Snapshot = { views: number; captured_at: string };

export function detectSpike(prev: Snapshot | undefined, nextViews: number, now = Date.now()): string | null {
  if (!prev) return null;
  const hours = Math.max((now - new Date(prev.captured_at).getTime()) / 3_600_000, 0.25);
  const gained = nextViews - prev.views;

  // Very large jump relative to the previous reading in a short time
  if (prev.views >= 500 && nextViews >= prev.views * 20 && hours <= 6) {
    return `views jumped ${prev.views.toLocaleString('en')} → ${nextViews.toLocaleString('en')} in ${hours.toFixed(1)}h`;
  }
  // Implausible absolute speed
  if (gained / hours > 2_000_000) {
    return `gained ${Math.round(gained / hours).toLocaleString('en')} views/hour`;
  }
  return null;
}
