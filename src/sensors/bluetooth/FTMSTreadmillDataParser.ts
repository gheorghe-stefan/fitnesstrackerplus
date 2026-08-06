import { TreadmillData } from '../../domain/TreadmillData';
import { ITreadmillProfile, SportstechF37sProfile } from './TreadmillProfiles';

/**
 * Re-export convertInclineLevelToPercentage for backwards compatibility and tests.
 */
export function convertInclineLevelToPercentage(level: number): number {
  return SportstechF37sProfile.parseIncline(level * 2).inclinationPercent;
}

/**
 * Parses raw FTMS Treadmill Data (Characteristic 0x2ACD) DataView.
 * Supports pluggable device profiles (defaults to Sportstech F37s profile).
 *
 * @param data DataView payload received from 0x2ACD notification
 * @param profile Pluggable profile strategy for manufacturer-specific quirks
 * @returns Parsed TreadmillData object
 */
export function parseFTMSTreadmillData(
  data: DataView,
  profile: ITreadmillProfile = SportstechF37sProfile
): TreadmillData {
  if (data.byteLength < 2) {
    return {
      speed: 0,
      inclination: 4.5,
      rawInclineLevel: 0,
      distance: 0,
      calories: 0,
      heartRate: 0,
      elapsedTime: 0,
    };
  }

  let offset = 0;
  const flags = data.getUint16(offset, true);
  offset += 2;

  let speed = 0;
  let rawInclineLevel = 0;
  let inclination = 4.5;
  let distance = 0;
  let calories = 0;
  let heartRate = 0;
  let elapsedTime = 0;

  // Bit 0: More Data. If 0, Instantaneous Speed is present (uint16, 1/100 km/h)
  const isInstSpeedPresent = (flags & (1 << 0)) === 0;
  if (isInstSpeedPresent && offset + 2 <= data.byteLength) {
    const rawSpeed = data.getUint16(offset, true);
    speed = rawSpeed / 100;
    offset += 2;
  }

  // Bit 1: Average Speed Present (uint16, 1/100 km/h)
  const isAvgSpeedPresent = (flags & (1 << 1)) !== 0;
  if (isAvgSpeedPresent && offset + 2 <= data.byteLength) {
    offset += 2;
  }

  // Bit 2: Total Distance Present (uint24, 3 bytes, meters)
  const isTotalDistancePresent = (flags & (1 << 2)) !== 0;
  if (isTotalDistancePresent && offset + 3 <= data.byteLength) {
    const b0 = data.getUint8(offset);
    const b1 = data.getUint8(offset + 1);
    const b2 = data.getUint8(offset + 2);
    distance = b0 | (b1 << 8) | (b2 << 16);
    offset += 3;
  }

  // Bit 3: Inclination and Ramp Angle Present
  // Inclination (sint16) + Ramp Angle (sint16)
  const isInclinationPresent = (flags & (1 << 3)) !== 0;
  if (isInclinationPresent && offset + 2 <= data.byteLength) {
    const rawInc = data.getInt16(offset, true);
    const parsed = profile.parseIncline(rawInc);
    rawInclineLevel = parsed.rawLevel;
    inclination = parsed.inclinationPercent;
    offset += 2;

    // Ramp angle follow-up sint16 if buffer allows
    if (offset + 2 <= data.byteLength) {
      offset += 2;
    }
  }

  // Bit 4: Elevation Gain Present (Pos uint16 + Neg uint16 = 4 bytes)
  const isElevationPresent = (flags & (1 << 4)) !== 0;
  if (isElevationPresent && offset + 4 <= data.byteLength) {
    offset += 4;
  }

  // Bit 5: Instantaneous Pace Present (uint8)
  const isInstPacePresent = (flags & (1 << 5)) !== 0;
  if (isInstPacePresent && offset + 1 <= data.byteLength) {
    offset += 1;
  }

  // Bit 6: Average Pace Present (uint8)
  const isAvgPacePresent = (flags & (1 << 6)) !== 0;
  if (isAvgPacePresent && offset + 1 <= data.byteLength) {
    offset += 1;
  }

  // Bit 7: Expended Energy Present (Total Energy uint16 kcal, Energy/Hour uint16, Energy/Min uint8)
  const isExpendedEnergyPresent = (flags & (1 << 7)) !== 0;
  if (isExpendedEnergyPresent && offset + 2 <= data.byteLength) {
    calories = data.getUint16(offset, true);
    offset += 2;
    if (offset + 2 <= data.byteLength) offset += 2; // Energy per Hour
    if (offset + 1 <= data.byteLength) offset += 1; // Energy per Minute
  }

  // Bit 8: Heart Rate Present (uint8)
  const isHeartRatePresent = (flags & (1 << 8)) !== 0;
  if (isHeartRatePresent && offset + 1 <= data.byteLength) {
    heartRate = data.getUint8(offset);
    offset += 1;
  }

  // Bit 9: Metabolic Equivalent Present (uint8)
  const isMetabolicPresent = (flags & (1 << 9)) !== 0;
  if (isMetabolicPresent && offset + 1 <= data.byteLength) {
    offset += 1;
  }

  // Bit 10: Elapsed Time Present (uint16, seconds)
  const isElapsedTimePresent = (flags & (1 << 10)) !== 0;
  if (isElapsedTimePresent && offset + 2 <= data.byteLength) {
    elapsedTime = data.getUint16(offset, true);
    offset += 2;
  }

  return {
    speed,
    inclination,
    rawInclineLevel,
    distance,
    calories,
    heartRate,
    elapsedTime,
  };
}
