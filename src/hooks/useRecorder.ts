import { useState, useRef, useCallback, useEffect } from 'react';
import { RecordingState, TrackPoint } from '../domain/models';
import { ActivityRecorder } from '../services/ActivityRecorder';

export interface RecorderState {
  recordingState: RecordingState;
  elapsedSeconds: number;
  elevationGain: number;
  recordedDistanceMeters: number;
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
  const [recordedDistanceMeters, setRecordedDistanceMeters] = useState(0.0);

  const simulatedAltitudeRef = useRef<number>(BASE_ELEVATION_METERS);
  const cumulativeGainRef = useRef<number>(0.0);
  const currentDistanceRef = useRef<number>(0.0);
  const prevGpsAltRef = useRef<number | null>(null);
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
      const inclination = currentData.inclination ?? 0;
      
      let treadmillDelta = 0;
      
      // 1. Calculate Treadmill Climb
      if (speed > 0) {
        const stepDistanceMeters = (speed / 3.6) * 1;
        currentDistanceRef.current += stepDistanceMeters;
        setRecordedDistanceMeters(currentDistanceRef.current);

        treadmillDelta = stepDistanceMeters * (inclination / 100);
        simulatedAltitudeRef.current += treadmillDelta;
      }
      
      // 2. Calculate GPS Delta
      let gpsDelta = 0;
      let absoluteEle = simulatedAltitudeRef.current;

      if (currentData.ele !== undefined) {
        absoluteEle = currentData.ele; // Strictly use real GPS altitude for the trackpoint
        
        if (prevGpsAltRef.current !== null) {
          gpsDelta = currentData.ele - prevGpsAltRef.current;
        }
        prevGpsAltRef.current = currentData.ele;
      }

      // 3. Accumulate True Elevation Gain (Only positive climbs count towards total gain)
      if (treadmillDelta > 0) cumulativeGainRef.current += treadmillDelta;
      if (gpsDelta > 0) cumulativeGainRef.current += gpsDelta;

      recorderRef.current.addDataPoint({
        ...currentData,
        ele: Number(absoluteEle.toFixed(2)),
      });

      setElevationGain(Number(cumulativeGainRef.current.toFixed(1)));
    }, 1000);
  }, [stopTimer]);

  const start = useCallback(() => {
    recorderRef.current.start();
    setRecordingState(RecordingState.Recording);
    setElapsedSeconds(0);
    simulatedAltitudeRef.current = BASE_ELEVATION_METERS;
    cumulativeGainRef.current = 0.0;
    currentDistanceRef.current = 0.0;
    prevGpsAltRef.current = null;
    setElevationGain(0.0);
    setRecordedDistanceMeters(0.0);
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
    simulatedAltitudeRef.current = BASE_ELEVATION_METERS;
    cumulativeGainRef.current = 0.0;
    currentDistanceRef.current = 0.0;
    prevGpsAltRef.current = null;
    setElevationGain(0.0);
    setRecordedDistanceMeters(0.0);
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
    recordedDistanceMeters,
    start,
    pause,
    resume,
    stop,
    reset,
    getTrackPoints,
    setSensorData,
  };
}
