import { liveSensorRegistry } from '../services/LiveSensorRegistry';
import { TreadmillData } from '../domain/TreadmillData';
import { PowerData } from '../domain/PowerData';
import { LocationData } from '../domain/models';

describe('LiveSensorRegistry', () => {
  beforeEach(() => {
    liveSensorRegistry.reset();
  });

  afterEach(() => {
    liveSensorRegistry.reset();
  });

  it('should return empty snapshot initially', () => {
    const snapshot = liveSensorRegistry.getSnapshot();
    expect(snapshot.speed).toBeUndefined();
    expect(snapshot.inclination).toBeUndefined();
    expect(snapshot.hr).toBeUndefined();
    expect(snapshot.power).toBeUndefined();
    expect(snapshot.cadence).toBeUndefined();
    expect(snapshot.lat).toBeUndefined();
    expect(snapshot.lng).toBeUndefined();
    expect(snapshot.ele).toBeUndefined();
  });

  it('should update and clear treadmill data', () => {
    const tmData: TreadmillData = {
      speed: 10.5,
      inclination: 3.0,
      rawInclineLevel: 3,
      distance: 500,
      calories: 50,
      heartRate: 130,
      elapsedTime: 60,
    };

    liveSensorRegistry.updateTreadmill(tmData);
    let snapshot = liveSensorRegistry.getSnapshot();
    expect(snapshot.speed).toBe(10.5);
    expect(snapshot.inclination).toBe(3.0);
    expect(snapshot.hr).toBe(130); // Treadmill HR used as fallback

    liveSensorRegistry.clearTreadmill();
    snapshot = liveSensorRegistry.getSnapshot();
    expect(snapshot.speed).toBeUndefined();
    expect(snapshot.inclination).toBeUndefined();
  });

  it('should prioritize standalone HR over treadmill HR', () => {
    const tmData: TreadmillData = {
      speed: 8.0,
      inclination: 0,
      rawInclineLevel: 0,
      distance: 100,
      calories: 10,
      heartRate: 120, // Treadmill HR
      elapsedTime: 20,
    };

    liveSensorRegistry.updateTreadmill(tmData);
    liveSensorRegistry.updateHeartRate(145); // Standalone HR

    const snapshot = liveSensorRegistry.getSnapshot();
    expect(snapshot.hr).toBe(145); // Standalone HR takes priority

    // When standalone HR disconnects, fallback to treadmill HR
    liveSensorRegistry.clearHeartRate();
    const fallbackSnapshot = liveSensorRegistry.getSnapshot();
    expect(fallbackSnapshot.hr).toBe(120);
  });

  it('should update and clear power data', () => {
    const powerData: PowerData = {
      power: 250,
      cadence: 85,
    };

    liveSensorRegistry.updatePower(powerData);
    let snapshot = liveSensorRegistry.getSnapshot();
    expect(snapshot.power).toBe(250);
    expect(snapshot.cadence).toBe(85);

    liveSensorRegistry.clearPower();
    snapshot = liveSensorRegistry.getSnapshot();
    expect(snapshot.power).toBeUndefined();
    expect(snapshot.cadence).toBeUndefined();
  });

  it('should update and clear location data', () => {
    const locData: LocationData = {
      latitude: 45.123,
      longitude: 9.456,
      altitude: 780.5,
    };

    liveSensorRegistry.updateLocation(locData);
    let snapshot = liveSensorRegistry.getSnapshot();
    expect(snapshot.lat).toBe(45.123);
    expect(snapshot.lng).toBe(9.456);
    expect(snapshot.ele).toBe(780.5);

    liveSensorRegistry.clearLocation();
    snapshot = liveSensorRegistry.getSnapshot();
    expect(snapshot.lat).toBeUndefined();
  });

  it('should reset all sensor data', () => {
    liveSensorRegistry.updateHeartRate(150);
    liveSensorRegistry.updatePower({ power: 200, cadence: 80 });
    liveSensorRegistry.reset();

    const snapshot = liveSensorRegistry.getSnapshot();
    expect(snapshot.hr).toBeUndefined();
    expect(snapshot.power).toBeUndefined();
  });
});
