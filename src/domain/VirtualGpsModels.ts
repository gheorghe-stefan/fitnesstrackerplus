export interface VirtualGpsConfig {
  /** Whether synthetic GPS & elevation generation is active */
  enabled: boolean;
  /** Origin latitude (default: 47.386254) */
  startLat: number;
  /** Origin longitude (default: 9.518632) */
  startLon: number;
  /** Origin base elevation in meters (default: 755.0) */
  startEle: number;
  /** ID of the selected path generator strategy (e.g. 'spiral', 'circular') */
  pathGeneratorId: string;
}

export interface IVirtualPathGenerator {
  readonly id: string;
  readonly name: string;
  /**
   * Calculates synthetic lat/lon coordinates given origin and total accumulated treadmill distance.
   */
  getPosition(startLat: number, startLon: number, totalDistanceMeters: number): { lat: number; lon: number };
}
