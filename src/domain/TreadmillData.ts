/**
 * Represents parsed live telemetry data received from a treadmill.
 */
export interface TreadmillData {
  /** Instantaneous speed in km/h */
  readonly speed: number;
  /** Calculated inclination grade percentage (e.g. 4.5% to 10.5%) */
  readonly inclination: number;
  /** Raw inclination level reported by hardware (0 to 15) */
  readonly rawInclineLevel: number;
  /** Total accumulated distance in meters */
  readonly distance: number;
  /** Total estimated energy expenditure in kcal */
  readonly calories: number;
  /** Heart rate in bpm (if relayed by treadmill, 0 otherwise) */
  readonly heartRate: number;
  /** Elapsed workout time in seconds */
  readonly elapsedTime: number;
}
