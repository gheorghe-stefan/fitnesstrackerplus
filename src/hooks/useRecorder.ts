import { useState, useRef, useCallback, useEffect } from 'react';
import { RecordingState, TrackPoint } from '../domain/models';
import { ActivityRecorder } from '../services/ActivityRecorder';

export interface RecorderState {
  recordingState: RecordingState;
  elapsedSeconds: number;
  elevationGain: number;
}

export interface RecorderActions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  getTrackPoints: () => ReadonlyArray<TrackPoint>;
  setSensorData: (data: Omit<TrackPoint, 'timestamp'>) => void;
}

const BASE_ELEVATION_METERS = 755.0;

/**
 * Custom hook wrapping the ActivityRecorder service.
 * Manages recording state, elapsed time via setInterval, and exact 1-second step
 * elevation gain accumulation. Uses refs to avoid stale closures in the interval callback.
 */
export function useRecorder(): RecorderState & RecorderActions {
  const recorderRef = useRef(new ActivityRecorder());
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.Idle);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [elevationGain, setElevationGain] = useState(0.0);

  const currentElevationRef = useRef<number>(BASE_ELEVATION_METERS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sensorDataRef = useRef<Omit<TrackPoint, 'timestamp'>>({});

  const stopTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);

      const currentData = sensorDataRef.current;
      const speed = currentData.speed ?? 0;
      const inclination = currentData.inclination ?? 4.5;

      let ele = currentElevationRef.current;
      if (speed > 0) {
        const stepDistanceMeters = (speed / 3.6) * 1;
        const stepElevationGainMeters = stepDistanceMeters * (inclination / 100);
        ele = Number((ele + stepElevationGainMeters).toFixed(2));
        currentElevationRef.current = ele;
      }

      recorderRef.current.addDataPoint({
        ...currentData,
        ele,
      });

      const totalGain = Number((ele - BASE_ELEVATION_METERS).toFixed(1));
      setElevationGain(totalGain > 0 ? totalGain : 0.0);
    }, 1000);
  }, [stopTimer]);

  const start = useCallback(() => {
    recorderRef.current.start();
    setRecordingState(RecordingState.Recording);
    setElapsedSeconds(0);
    currentElevationRef.current = BASE_ELEVATION_METERS;
    setElevationGain(0.0);
    startTimer();
  }, [startTimer]);

  const pause = useCallback(() => {
    recorderRef.current.pause();
    setRecordingState(RecordingState.Paused);
    stopTimer();
  }, [stopTimer]);

  const resume = useCallback(() => {
    recorderRef.current.resume();
    setRecordingState(RecordingState.Recording);
    startTimer();
  }, [startTimer]);

  const stop = useCallback(() => {
    recorderRef.current.stop();
    setRecordingState(RecordingState.Stopped);
    stopTimer();
  }, [stopTimer]);

  const reset = useCallback(() => {
    recorderRef.current.reset();
    setRecordingState(RecordingState.Idle);
    setElapsedSeconds(0);
    currentElevationRef.current = BASE_ELEVATION_METERS;
    setElevationGain(0.0);
    sensorDataRef.current = {};
  }, []);

  const getTrackPoints = useCallback(() => {
    return recorderRef.current.trackPoints;
  }, []);

  const setSensorData = useCallback((data: Omit<TrackPoint, 'timestamp'>) => {
    sensorDataRef.current = data;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  return {
    recordingState,
    elapsedSeconds,
    elevationGain,
    start,
    pause,
    resume,
    stop,
    reset,
    getTrackPoints,
    setSensorData,
  };
}
