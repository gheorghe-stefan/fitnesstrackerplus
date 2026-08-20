import { useState, useRef, useCallback, useEffect } from 'react';
import { RecordingState, TrackPoint } from '../domain/models';
import { ActivityRecorder } from '../services/ActivityRecorder';

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface RecorderState {
  recordingState: RecordingState;
  elapsedSeconds: number;
  elevationGain: number;
  recordedDistanceMeters: number;
  currentSpeed: number;
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

export function useRecorder(): RecorderState & RecorderActions {
  const recorderRef = useRef(new ActivityRecorder());
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.Idle);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [elevationGain, setElevationGain] = useState(0.0);
  const [recordedDistanceMeters, setRecordedDistanceMeters] = useState(0.0);
  const [currentSpeed, setCurrentSpeed] = useState(0.0);

  const simulatedAltitudeRef = useRef<number>(BASE_ELEVATION_METERS);
  const cumulativeGainRef = useRef<number>(0.0);
  const currentDistanceRef = useRef<number>(0.0);
  const prevGpsAltRef = useRef<number | null>(null);
  const prevLatRef = useRef<number | null>(null);
  const prevLngRef = useRef<number | null>(null);
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
      const tmSpeed = currentData.speed ?? 0;
      const inclination = currentData.inclination ?? 0;
      
      // 1. Calculate Distance & Speed
      let stepDistanceMeters = 0;
      let calculatedSpeedKmH = tmSpeed;

      if (tmSpeed > 0) {
        stepDistanceMeters = (tmSpeed / 3.6) * 1;
      } else if (currentData.lat !== undefined && currentData.lng !== undefined) {
        if (prevLatRef.current !== null && prevLngRef.current !== null) {
          stepDistanceMeters = getDistanceMeters(prevLatRef.current, prevLngRef.current, currentData.lat, currentData.lng);
          calculatedSpeedKmH = (stepDistanceMeters / 1) * 3.6;
        }
      }

      prevLatRef.current = currentData.lat ?? null;
      prevLngRef.current = currentData.lng ?? null;

      currentDistanceRef.current += stepDistanceMeters;
      setRecordedDistanceMeters(currentDistanceRef.current);
      setCurrentSpeed(calculatedSpeedKmH);

      // 2. Calculate Elevation Gain (Simulated & GPS)
      let treadmillDelta = 0;
      if (tmSpeed > 0) {
        const treadmillStepDistance = (tmSpeed / 3.6) * 1;
        treadmillDelta = treadmillStepDistance * (inclination / 100);
        simulatedAltitudeRef.current += treadmillDelta;
      }
      
      let gpsDelta = 0;
      let absoluteEle = simulatedAltitudeRef.current;

      if (currentData.ele !== undefined) {
        absoluteEle = currentData.ele; // Strictly use real GPS altitude for the trackpoint
        
        if (prevGpsAltRef.current !== null) {
          gpsDelta = currentData.ele - prevGpsAltRef.current;
        }
        prevGpsAltRef.current = currentData.ele;
      }

      // Accumulate True Elevation Gain (Only positive climbs count towards total gain)
      if (treadmillDelta > 0) cumulativeGainRef.current += treadmillDelta;
      if (gpsDelta > 0) cumulativeGainRef.current += gpsDelta;

      recorderRef.current.addDataPoint({
        ...currentData,
        speed: Number(calculatedSpeedKmH.toFixed(2)),
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
    currentSpeed,
    start,
    pause,
    resume,
    stop,
    reset,
    getTrackPoints,
    setSensorData,
  };
}
