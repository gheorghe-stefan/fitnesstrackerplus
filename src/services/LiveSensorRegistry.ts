import { LocationData, TrackPoint } from '../domain/models';
import { TreadmillData } from '../domain/TreadmillData';
import { PowerData } from '../domain/PowerData';

/**
 * Direct in-memory registry holding the latest hardware sensor readings.
 *
 * Updated synchronously at the BLE / Geolocation callback level, bypassing
 * React's UI render pipeline and useEffect batching. This guarantees that
 * the 1-second background recording worker always reads instantaneous
 * hardware data even when the browser tab is hidden and UI renders are throttled.
 */
export class LiveSensorRegistry {
  private static instance: LiveSensorRegistry | null = null;

  public static getInstance(): LiveSensorRegistry {
    if (!LiveSensorRegistry.instance) {
      LiveSensorRegistry.instance = new LiveSensorRegistry();
    }
    return LiveSensorRegistry.instance;
  }

  private treadmill: TreadmillData | null = null;
  private standaloneHr: number | null = null;
  private power: PowerData | null = null;
  private location: LocationData | null = null;

  public updateTreadmill(data: TreadmillData): void {
    this.treadmill = data;
  }

  public clearTreadmill(): void {
    this.treadmill = null;
  }

  public updateHeartRate(hr: number): void {
    this.standaloneHr = hr;
  }

  public clearHeartRate(): void {
    this.standaloneHr = null;
  }

  public updatePower(data: PowerData): void {
    this.power = data;
  }

  public clearPower(): void {
    this.power = null;
  }

  public updateLocation(data: LocationData): void {
    this.location = data;
  }

  public clearLocation(): void {
    this.location = null;
  }

  public reset(): void {
    this.treadmill = null;
    this.standaloneHr = null;
    this.power = null;
    this.location = null;
  }

  /**
   * Returns the current consolidated snapshot for recording.
   * Prioritizes standalone HR sensor over treadmill HR fallback.
   */
  public getSnapshot(): Omit<TrackPoint, 'timestamp'> {
    let effectiveHr: number | undefined = undefined;
    if (this.standaloneHr !== null && this.standaloneHr > 0) {
      effectiveHr = this.standaloneHr;
    } else if (this.treadmill !== null && this.treadmill.heartRate > 0) {
      effectiveHr = this.treadmill.heartRate;
    }

    return {
      hr: effectiveHr,
      speed: this.treadmill ? this.treadmill.speed : undefined,
      inclination: this.treadmill ? this.treadmill.inclination : undefined,
      cadence: this.power ? this.power.cadence : undefined,
      power: this.power ? this.power.power : undefined,
      lat: this.location ? this.location.latitude : undefined,
      lng: this.location ? this.location.longitude : undefined,
      ele: this.location ? this.location.altitude : undefined,
    };
  }
}

export const liveSensorRegistry = LiveSensorRegistry.getInstance();
