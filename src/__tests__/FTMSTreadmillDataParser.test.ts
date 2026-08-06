import {
  convertInclineLevelToPercentage,
  parseFTMSTreadmillData,
} from '../sensors/bluetooth/FTMSTreadmillDataParser';

describe('FTMSTreadmillDataParser', () => {
  describe('convertInclineLevelToPercentage', () => {
    it('returns 4.5% for level 0', () => {
      expect(convertInclineLevelToPercentage(0)).toBe(4.5);
    });

    it('returns 4.5% for negative levels', () => {
      expect(convertInclineLevelToPercentage(-1)).toBe(4.5);
    });

    it('calculates correct percentages for levels 1 through 15', () => {
      expect(convertInclineLevelToPercentage(1)).toBe(6.3);
      expect(convertInclineLevelToPercentage(2)).toBe(6.6);
      expect(convertInclineLevelToPercentage(5)).toBe(7.5);
      expect(convertInclineLevelToPercentage(8)).toBe(8.4);
      expect(convertInclineLevelToPercentage(12)).toBe(9.6);
      expect(convertInclineLevelToPercentage(15)).toBe(10.5);
    });

    it('clamps levels above 15 to 10.5%', () => {
      expect(convertInclineLevelToPercentage(20)).toBe(10.5);
    });
  });

  describe('parseFTMSTreadmillData', () => {
    it('handles empty or truncated DataView gracefully', () => {
      const buffer = new ArrayBuffer(0);
      const dataView = new DataView(buffer);
      const result = parseFTMSTreadmillData(dataView);

      expect(result).toEqual({
        speed: 0,
        inclination: 4.5,
        rawInclineLevel: 0,
        distance: 0,
        calories: 0,
        heartRate: 0,
        elapsedTime: 0,
      });
    });

    it('parses speed when bit 0 = 0 (Instantaneous Speed present)', () => {
      // Flags = 0x0000 (bit 0 is 0 => speed present)
      // Speed = 1000 (10.00 km/h) -> 0x03E8 Little Endian: 0xE8, 0x03
      const buffer = new Uint8Array([0x00, 0x00, 0xe8, 0x03]).buffer;
      const dataView = new DataView(buffer);
      const result = parseFTMSTreadmillData(dataView);

      expect(result.speed).toBe(10.0);
      expect(result.inclination).toBe(4.5);
    });

    it('parses speed, total distance, inclination, energy, heart rate, and elapsed time', () => {
      // Flags bitmask:
      // Bit 0 = 0 (Speed present)
      // Bit 2 = 1 (Total Distance present -> 0x0004)
      // Bit 3 = 1 (Inclination present -> 0x0008)
      // Bit 7 = 1 (Expended Energy present -> 0x0080)
      // Bit 8 = 1 (Heart Rate present -> 0x0100)
      // Bit 10 = 1 (Elapsed Time present -> 0x0400)
      // Flags = 0x0004 | 0x0008 | 0x0080 | 0x0100 | 0x0400 = 0x058C

      const flags = 0x058c;
      const speedRaw = 1250; // 12.50 km/h
      const distRaw = 2500; // 2500 meters (uint24: 0xC4, 0x09, 0x00)
      const inclineRaw = 25; // Level 5 (raw 25 = 5 * 5) -> 7.5%
      const rampAngle = 0;
      const caloriesRaw = 185; // 185 kcal
      const hrRaw = 145; // 145 bpm
      const elapsedTimeRaw = 620; // 620 seconds

      const buffer = new ArrayBuffer(24);
      const dataView = new DataView(buffer);

      let offset = 0;
      dataView.setUint16(offset, flags, true); offset += 2;
      dataView.setUint16(offset, speedRaw, true); offset += 2;
      
      // uint24 distance
      dataView.setUint8(offset, distRaw & 0xff);
      dataView.setUint8(offset + 1, (distRaw >> 8) & 0xff);
      dataView.setUint8(offset + 2, (distRaw >> 16) & 0xff);
      offset += 3;

      dataView.setInt16(offset, inclineRaw, true); offset += 2;
      dataView.setInt16(offset, rampAngle, true); offset += 2;

      dataView.setUint16(offset, caloriesRaw, true); offset += 2;
      dataView.setUint16(offset, 0, true); offset += 2; // Energy/Hour
      dataView.setUint8(offset, 0); offset += 1; // Energy/Min

      dataView.setUint8(offset, hrRaw); offset += 1;

      dataView.setUint16(offset, elapsedTimeRaw, true); offset += 2;

      const result = parseFTMSTreadmillData(dataView);

      expect(result.speed).toBe(12.5);
      expect(result.rawInclineLevel).toBe(5);
      expect(result.inclination).toBe(7.5);
      expect(result.distance).toBe(2500);
      expect(result.calories).toBe(185);
      expect(result.heartRate).toBe(145);
      expect(result.elapsedTime).toBe(620);
    });
  });
});
