import { VirtualGpsService } from '../services/VirtualGpsService';
import { SpiralPathGenerator } from '../services/VirtualPathGenerators';

describe('VirtualGpsService', () => {
  let service: VirtualGpsService;

  beforeEach(() => {
    localStorage.clear();
    service = new VirtualGpsService();
  });

  it('loads default home origin configuration', () => {
    const config = service.getConfig();
    expect(config.enabled).toBe(true);
    expect(config.startLat).toBe(47.386254);
    expect(config.startLon).toBe(9.518632);
    expect(config.startEle).toBe(755.0);
    expect(config.pathGeneratorId).toBe('spiral');
  });

  it('calculates 105m elevation gain for 1000m at 10.5% incline', () => {
    service.resetSession();
    const speedKmH = 36.0; // 36 km/h = 10 m/s for simple 100s math (1000m total)
    const inclinePercent = 10.5;

    let lastResult = { lat: 0, lon: 0, ele: 755.0 };
    for (let i = 0; i < 100; i++) {
      lastResult = service.computeStepData(speedKmH, inclinePercent, 1);
    }

    // 100s * 10 m/s = 1000m total distance
    // 1000m * 10.5% grade = 105.0m elevation gain
    // 755.0 + 105.0 = 860.0m
    expect(lastResult.ele).toBe(860.0);
  });

  it('generates non-zero lat/lon coordinates along spiral path as distance accumulates', () => {
    service.resetSession();
    const initial = service.computeStepData(0, 0, 0);
    expect(initial.lat).toBe(47.386254);
    expect(initial.lon).toBe(9.518632);

    // Advance 500 meters
    const moved = service.computeStepData(18.0, 5.0, 100); // 5m/s * 100s = 500m
    expect(moved.lat).not.toBe(47.386254);
    expect(moved.lon).not.toBe(9.518632);
  });

  it('persists configuration updates to localStorage', () => {
    service.updateConfig({ startLat: 48.0, startLon: 10.0, startEle: 500.0 });
    const updated = service.getConfig();
    expect(updated.startLat).toBe(48.0);
    expect(updated.startLon).toBe(10.0);
    expect(updated.startEle).toBe(500.0);

    const reloadedService = new VirtualGpsService();
    expect(reloadedService.getConfig().startLat).toBe(48.0);
  });
});

describe('SpiralPathGenerator', () => {
  it('returns origin coordinates when distance is zero', () => {
    const origin = SpiralPathGenerator.getPosition(47.386254, 9.518632, 0);
    expect(origin.lat).toBe(47.386254);
    expect(origin.lon).toBe(9.518632);
  });

  it('generates smooth spiral offsets for positive distances', () => {
    const pos1 = SpiralPathGenerator.getPosition(47.386254, 9.518632, 100);
    const pos2 = SpiralPathGenerator.getPosition(47.386254, 9.518632, 200);

    expect(pos1.lat).not.toEqual(pos2.lat);
    expect(pos1.lon).not.toEqual(pos2.lon);
  });
});
