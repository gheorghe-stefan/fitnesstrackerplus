import { SportstechF37sProfile } from '../sensors/bluetooth/TreadmillProfiles';

/**
 * Mathematical formula for step elevation gain over a time delta (in seconds):
 * 
 * stepDistanceMeters = (speedKmH / 3.6) * durationSeconds
 * inclinationPercent = profile.parseIncline(rawIncline).inclinationPercent
 * stepElevationGainMeters = stepDistanceMeters * (inclinationPercent / 100)
 */
export function calculateElevationGain(
  speedKmH: number,
  rawIncline: number,
  durationSeconds: number
): { stepDistanceMeters: number; stepElevationGainMeters: number; climbTimeFor10MetersSeconds: number } {
  const { inclinationPercent } = SportstechF37sProfile.parseIncline(rawIncline);
  const stepDistanceMeters = (speedKmH / 3.6) * durationSeconds;
  const stepElevationGainMeters = stepDistanceMeters * (inclinationPercent / 100);

  // Time in seconds required to climb 10 meters at this speed and incline
  const climbRatePerSecond = (speedKmH / 3.6) * (inclinationPercent / 100);
  const climbTimeFor10MetersSeconds = climbRatePerSecond > 0 ? 10.0 / climbRatePerSecond : 0;

  return {
    stepDistanceMeters: Number(stepDistanceMeters.toFixed(4)),
    stepElevationGainMeters: Number(stepElevationGainMeters.toFixed(4)),
    climbTimeFor10MetersSeconds: Number(climbTimeFor10MetersSeconds.toFixed(2)),
  };
}

describe('Elevation Calculation Math & Duration Test Suite', () => {
  it('case 1: walking 5.0 km/h @ Level 15 (10.5% grade) climbs 10.0m in exactly 68.57 seconds', () => {
    // Input: speed = 5.0 km/h, rawIncline = 150 (Level 15 = 10.5%), duration = 68.5714 seconds
    const rawIncline = 150; // Level 15
    const speed = 5.0; // km/h
    const duration = 68.5714; // seconds

    const result = calculateElevationGain(speed, rawIncline, duration);

    // Speed in m/s = 5 / 3.6 = 1.388889 m/s
    // Distance in 68.5714s = 1.388889 * 68.5714 = 95.238 m
    // Elevation gain = 95.238 * 0.105 = 10.000 m
    expect(result.climbTimeFor10MetersSeconds).toBeCloseTo(68.57, 2);
    expect(result.stepElevationGainMeters).toBeCloseTo(10.0, 2);
  });

  it('case 2: 14 seconds at 1.0 km/h @ Level 15 (10.5% grade) accumulates 0.41m (NOT 285.5m)', () => {
    // Input from screenshot bug case: speed = 1.0 km/h, rawIncline = 150 (Level 15), duration = 14 seconds
    const rawIncline = 150; // Level 15 (10.5%)
    const speed = 1.0; // km/h
    const duration = 14; // seconds

    const result = calculateElevationGain(speed, rawIncline, duration);

    // Speed in m/s = 1 / 3.6 = 0.277778 m/s
    // Distance in 14s = 0.277778 * 14 = 3.88889 m
    // Elevation gain = 3.88889 * 0.105 = 0.4083 m -> 0.41m
    expect(result.stepElevationGainMeters).toBe(0.4083);
  });

  it('case 3: 300 seconds (5 mins) at 12.0 km/h @ Level 15 (10.5% grade) climbs 105.0m', () => {
    // Input: speed = 12.0 km/h, rawIncline = 150 (Level 15 = 10.5%), duration = 300 seconds (1000m)
    const rawIncline = 150; // Level 15
    const speed = 12.0; // km/h
    const duration = 300; // seconds

    const result = calculateElevationGain(speed, rawIncline, duration);

    // Distance = (12 / 3.6) * 300 = 1000m
    // Elevation gain = 1000 * 0.105 = 105.0m
    expect(result.stepDistanceMeters).toBe(1000.0);
    expect(result.stepElevationGainMeters).toBe(105.0);
  });
});
