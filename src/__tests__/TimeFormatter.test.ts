import { formatTime } from '../services/TimeFormatter';

describe('formatTime', () => {
  it('should format 0 seconds', () => {
    expect(formatTime(0)).toBe('00:00:00');
  });

  it('should format seconds only', () => {
    expect(formatTime(5)).toBe('00:00:05');
    expect(formatTime(59)).toBe('00:00:59');
  });

  it('should format minutes and seconds', () => {
    expect(formatTime(60)).toBe('00:01:00');
    expect(formatTime(90)).toBe('00:01:30');
    expect(formatTime(3599)).toBe('00:59:59');
  });

  it('should format hours, minutes, and seconds', () => {
    expect(formatTime(3600)).toBe('01:00:00');
    expect(formatTime(3661)).toBe('01:01:01');
    expect(formatTime(7322)).toBe('02:02:02');
  });

  it('should handle large values', () => {
    expect(formatTime(360000)).toBe('100:00:00');
  });
});
