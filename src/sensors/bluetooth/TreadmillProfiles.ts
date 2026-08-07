/**
 * Strategy interface for parsing treadmill incline data across different manufacturers.
 */
export interface ITreadmillProfile {
  readonly id: string;
  readonly name: string;
  parseIncline(rawInc: number): { rawLevel: number; inclinationPercent: number };
}

/**
 * Sportstech F37s Profile:
 * - Hardware transmits incline as rawInc = Level * 10 (e.g. Level 0 = 0, Level 1 = 10, Level 15 = 150)
 * - Physical grade starts at 4.5% (Level 0) and scales from 6.3% to 10.5% (Levels 1..15)
 */
export const SportstechF37sProfile: ITreadmillProfile = {
  id: 'sportstech_f37s',
  name: 'Sportstech F37s',
  parseIncline(rawInc: number) {
    // Sportstech F37s hardware transmits rawInc = Level * 10:
    // Level 0  -> rawInc = 0   (0 / 10 = 0)   -> 4.5%
    // Level 1  -> rawInc = 10  (10 / 10 = 1)  -> 6.3%
    // Level 2  -> rawInc = 20  (20 / 10 = 2)  -> 6.6%
    // Level 8  -> rawInc = 80  (80 / 10 = 8)  -> 8.4%
    // Level 15 -> rawInc = 150 (150 / 10 = 15) -> 10.5%
    const level = rawInc / 10;
    const clampedLevel = Math.max(0, Math.min(15, Math.round(level)));
    const percent = clampedLevel <= 0 ? 4.5 : Number((6.0 + clampedLevel * 0.3).toFixed(1));
    return { rawLevel: clampedLevel, inclinationPercent: percent };
  },
};

/**
 * Standard FTMS Profile (Bluetooth SIG Specification):
 * - Transmits sint16 directly in 0.1% grade units (e.g. 85 = 8.5% grade)
 */
export const StandardFTMSProfile: ITreadmillProfile = {
  id: 'standard_ftms',
  name: 'Standard FTMS',
  parseIncline(rawInc: number) {
    const percent = Number((rawInc / 10).toFixed(1));
    const rawLevel = Math.round(percent);
    return { rawLevel, inclinationPercent: percent };
  },
};

export const TreadmillProfiles: Record<string, ITreadmillProfile> = {
  sportstech_f37s: SportstechF37sProfile,
  standard_ftms: StandardFTMSProfile,
};
