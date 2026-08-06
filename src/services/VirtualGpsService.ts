import { VirtualGpsConfig } from '../domain/VirtualGpsModels';
import { AvailablePathGenerators, SpiralPathGenerator } from './VirtualPathGenerators';

export const DEFAULT_VIRTUAL_GPS_CONFIG: VirtualGpsConfig = {
  enabled: true,
  startLat: 47.386254,
  startLon: 9.518632,
  startEle: 755.0,
  pathGeneratorId: 'spiral',
};

const STORAGE_KEY = 'fitnesstrackerplus_gps_config';

export class VirtualGpsService {
  private config: VirtualGpsConfig;
  private accumulatedDistanceMeters: number = 0;
  private currentElevationMeters: number = 0;

  constructor() {
    this.config = this.loadConfig();
    this.currentElevationMeters = this.config.startEle;
  }

  public getConfig(): VirtualGpsConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<VirtualGpsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig(this.config);
  }

  public resetSession(): void {
    this.accumulatedDistanceMeters = 0;
    this.currentElevationMeters = this.config.startEle;
  }

  /**
   * Computes synthetic GPS coordinates (lat, lon, ele) for a workout step.
   *
   * @param speedKmH Current speed in km/h
   * @param inclinePercent Current incline grade percentage
   * @param deltaTimeSec Time elapsed in seconds (typically 1s)
   */
  public computeStepData(
    speedKmH: number,
    inclinePercent: number,
    deltaTimeSec: number = 1
  ): { lat: number; lon: number; ele: number } {
    if (!this.config.enabled) {
      return {
        lat: this.config.startLat,
        lon: this.config.startLon,
        ele: this.config.startEle,
      };
    }

    if (speedKmH > 0 && deltaTimeSec > 0) {
      const stepDistanceMeters = (speedKmH / 3.6) * deltaTimeSec;
      this.accumulatedDistanceMeters += stepDistanceMeters;

      const stepElevationGainMeters = stepDistanceMeters * (inclinePercent / 100);
      this.currentElevationMeters += stepElevationGainMeters;
    }

    const generator =
      AvailablePathGenerators[this.config.pathGeneratorId] ?? SpiralPathGenerator;

    const { lat, lon } = generator.getPosition(
      this.config.startLat,
      this.config.startLon,
      this.accumulatedDistanceMeters
    );

    return {
      lat,
      lon,
      ele: Number(this.currentElevationMeters.toFixed(2)),
    };
  }

  private loadConfig(): VirtualGpsConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_VIRTUAL_GPS_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load VirtualGpsConfig from localStorage', e);
    }
    return { ...DEFAULT_VIRTUAL_GPS_CONFIG };
  }

  private saveConfig(config: VirtualGpsConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save VirtualGpsConfig to localStorage', e);
    }
  }
}
