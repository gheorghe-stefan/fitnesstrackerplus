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
 * - Hardware transmits incline as half-step levels (e.g., Level 15 = 30, Level 10 = 20)
 * - Physical grade starts at 4.5% (Level 0) and scales from 6.3% to 10.5% (Levels 1..15)
 */
export const SportstechF37sProfile: ITreadmillProfile = {
  id: 'sportstech_f37s',
  name: 'Sportstech F37s',
  parseIncline(rawInc: number) {
    // Sportstech F37s hardware transmits incline scaled by 5 (each level = 5 units):
    // Level 0  -> rawInc = 0   (0 / 5 = 0)  -> 4.5%
    // Level 1  -> rawInc = 5   (5 / 5 = 1)  -> 6.3%
    // Level 2  -> rawInc = 10  (10 / 5 = 2) -> 6.6%
    // Level 8  -> rawInc = 40  (40 / 5 = 8) -> 8.4%
    // Level 15 -> rawInc = 75  (75 / 5 = 15)-> 10.5%
    const level = rawInc / 5;
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
