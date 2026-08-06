import { ActivityRecorder } from '../services/ActivityRecorder';
import { RecordingState } from '../domain/models';

describe('ActivityRecorder', () => {
  let recorder: ActivityRecorder;

  beforeEach(() => {
    recorder = new ActivityRecorder();
  });

  describe('initial state', () => {
    it('should start in Idle state', () => {
      expect(recorder.state).toBe(RecordingState.Idle);
    });

    it('should have empty track points', () => {
      expect(recorder.trackPoints).toHaveLength(0);
    });
  });

  describe('state transitions', () => {
    it('should transition from Idle to Recording on start', () => {
      recorder.start();
      expect(recorder.state).toBe(RecordingState.Recording);
    });

    it('should transition from Recording to Paused on pause', () => {
      recorder.start();
      recorder.pause();
      expect(recorder.state).toBe(RecordingState.Paused);
    });

    it('should transition from Paused to Recording on resume', () => {
      recorder.start();
      recorder.pause();
      recorder.resume();
      expect(recorder.state).toBe(RecordingState.Recording);
    });

    it('should transition from Recording to Stopped on stop', () => {
      recorder.start();
      recorder.stop();
      expect(recorder.state).toBe(RecordingState.Stopped);
    });

    it('should transition from Paused to Stopped on stop', () => {
      recorder.start();
      recorder.pause();
      recorder.stop();
      expect(recorder.state).toBe(RecordingState.Stopped);
    });

    it('should ignore start when not Idle', () => {
      recorder.start();
      recorder.start(); // should be ignored
      expect(recorder.state).toBe(RecordingState.Recording);
    });

    it('should ignore pause when not Recording', () => {
      recorder.pause(); // should be ignored (Idle)
      expect(recorder.state).toBe(RecordingState.Idle);
    });

    it('should ignore resume when not Paused', () => {
      recorder.start();
      recorder.resume(); // should be ignored (Recording, not Paused)
      expect(recorder.state).toBe(RecordingState.Recording);
    });

    it('should ignore stop when Idle', () => {
      recorder.stop(); // should be ignored
      expect(recorder.state).toBe(RecordingState.Idle);
    });
  });

  describe('data points', () => {
    it('should add data points when Recording', () => {
      recorder.start();
      recorder.addDataPoint({ hr: 72 });
      recorder.addDataPoint({ hr: 75 });
      expect(recorder.trackPoints).toHaveLength(2);
      expect(recorder.trackPoints[0].hr).toBe(72);
      expect(recorder.trackPoints[1].hr).toBe(75);
    });

    it('should include timestamp in data points', () => {
      recorder.start();
      const before = new Date();
      recorder.addDataPoint({ hr: 72 });
      const after = new Date();
      expect(recorder.trackPoints[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(recorder.trackPoints[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should ignore data points when Idle', () => {
      recorder.addDataPoint({ hr: 72 });
      expect(recorder.trackPoints).toHaveLength(0);
    });

    it('should ignore data points when Paused', () => {
      recorder.start();
      recorder.addDataPoint({ hr: 72 });
      recorder.pause();
      recorder.addDataPoint({ hr: 75 });
      expect(recorder.trackPoints).toHaveLength(1);
    });

    it('should ignore data points when Stopped', () => {
      recorder.start();
      recorder.addDataPoint({ hr: 72 });
      recorder.stop();
      recorder.addDataPoint({ hr: 75 });
      expect(recorder.trackPoints).toHaveLength(1);
    });

    it('should clear track points on new start after reset', () => {
      recorder.start();
      recorder.addDataPoint({ hr: 72 });
      recorder.stop();
      recorder.reset();
      recorder.start();
      expect(recorder.trackPoints).toHaveLength(0);
    });

    it('should support multiple sensor fields', () => {
      recorder.start();
      recorder.addDataPoint({ hr: 140, speed: 12.5, inclination: 3 });
      expect(recorder.trackPoints[0].hr).toBe(140);
      expect(recorder.trackPoints[0].speed).toBe(12.5);
      expect(recorder.trackPoints[0].inclination).toBe(3);
    });
  });

  describe('reset', () => {
    it('should reset state to Idle', () => {
      recorder.start();
      recorder.addDataPoint({ hr: 72 });
      recorder.reset();
      expect(recorder.state).toBe(RecordingState.Idle);
      expect(recorder.trackPoints).toHaveLength(0);
    });
  });
});
