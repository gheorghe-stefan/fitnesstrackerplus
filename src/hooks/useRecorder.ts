import { useState, useRef, useCallback, useEffect } from 'react';
import { RecordingState, TrackPoint } from '../domain/models';
import { ActivityRecorder } from '../services/ActivityRecorder';

export interface RecorderState {
  recordingState: RecordingState;
  elapsedSeconds: number;
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

/**
 * Custom hook wrapping the ActivityRecorder service.
 * Manages recording state, elapsed time via setInterval, and data point
 * collection. Uses a ref for sensor data to avoid stale closures in the
 * interval callback.
 */
export function useRecorder(): RecorderState & RecorderActions {
  const recorderRef = useRef(new ActivityRecorder());
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.Idle);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
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
      recorderRef.current.addDataPoint(sensorDataRef.current);
    }, 1000);
  }, [stopTimer]);

  const start = useCallback(() => {
    recorderRef.current.start();
    setRecordingState(RecordingState.Recording);
    setElapsedSeconds(0);
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
    start,
    pause,
    resume,
    stop,
    reset,
    getTrackPoints,
    setSensorData,
  };
}
