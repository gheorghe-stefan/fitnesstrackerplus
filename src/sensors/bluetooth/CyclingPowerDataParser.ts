export interface RawPowerData {
  power: number;
  crankRevolutions?: number;
  lastCrankEventTime?: number; // in 1/1024s
}

export function parseCyclingPowerData(data: DataView): RawPowerData {
  if (data.byteLength < 4) {
    return { power: 0 };
  }

  let offset = 0;
  const flags = data.getUint16(offset, true);
  offset += 2;

  const power = data.getInt16(offset, true);
  offset += 2;

  // Bit 0: Pedal Power Balance Present
  if ((flags & (1 << 0)) !== 0) {
    offset += 1;
  }

  // Bit 2: Accumulated Torque Present
  if ((flags & (1 << 2)) !== 0) {
    offset += 2;
  }

  // Bit 4: Wheel Revolution Data Present
  if ((flags & (1 << 4)) !== 0) {
    offset += 6; // uint32 (4) + uint16 (2)
  }

  let crankRevolutions;
  let lastCrankEventTime;

  // Bit 5: Crank Revolution Data Present
  if ((flags & (1 << 5)) !== 0 && offset + 4 <= data.byteLength) {
    crankRevolutions = data.getUint16(offset, true);
    offset += 2;
    lastCrankEventTime = data.getUint16(offset, true);
    offset += 2;
  }

  return { power, crankRevolutions, lastCrankEventTime };
}
