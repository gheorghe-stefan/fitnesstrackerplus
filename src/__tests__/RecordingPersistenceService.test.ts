import { RecordingPersistenceService } from '../services/RecordingPersistenceService';
import { RecordingState } from '../domain/models';

describe('RecordingPersistenceService', () => {
  let service: RecordingPersistenceService;

  beforeEach(() => {
    localStorage.clear();
    service = new RecordingPersistenceService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return null when no session is stored', () => {
    expect(service.loadSession()).toBeNull();
  });

  it('should save and load an active recording session', () => {
    const session = {
      version: 1,
      recordingState: RecordingState.Recording,
      startTimestamp: Date.now() - 5000,
      lastUpdatedTimestamp: Date.now(),
      elapsedSeconds: 5,
      elevationGain: 2.5,
      recordedDistanceMeters: 45.0,
      simulatedAltitude: 757.5,
      trackPoints: [
        {
          timestamp: new Date(),
          speed: 9.0,
          ele: 755.0,
        },
      ],
    };

    service.saveSession(session);
    const restored = service.loadSession();
    expect(restored).not.toBeNull();
    expect(restored?.recordingState).toBe(RecordingState.Recording);
    expect(restored?.elapsedSeconds).toBe(5);
    expect(restored?.elevationGain).toBe(2.5);
    expect(restored?.trackPoints).toHaveLength(1);
    expect(restored?.trackPoints[0].timestamp).toBeInstanceOf(Date);
  });

  it('should clear stored session', () => {
    service.saveSession({
      version: 1,
      recordingState: RecordingState.Paused,
      startTimestamp: Date.now(),
      lastUpdatedTimestamp: Date.now(),
      elapsedSeconds: 10,
      elevationGain: 0,
      recordedDistanceMeters: 0,
      simulatedAltitude: 755,
      trackPoints: [],
    });

    expect(service.loadSession()).not.toBeNull();
    service.clearSession();
    expect(service.loadSession()).toBeNull();
  });
});
