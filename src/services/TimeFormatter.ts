/**
 * Formats elapsed seconds into HH:MM:SS display string.
 * Pure function — no side effects, fully testable.
 */
export function formatTime(totalSeconds: number): string {
  const floored = Math.floor(totalSeconds);
  const h = Math.floor(floored / 3600);
  const m = Math.floor((floored % 3600) / 60);
  const s = floored % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
