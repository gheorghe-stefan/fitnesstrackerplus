import { useState, useRef, useCallback, useEffect } from 'react';
import { RecordingState, TrackPoint } from '../domain/models';
import { ActivityRecorder } from '../services/ActivityRecorder';
import { BackgroundKeepAliveService } from '../services/BackgroundKeepAliveService';
import { BackgroundTimer } from '../services/BackgroundTimer';
import { liveSensorRegistry } from '../services/LiveSensorRegistry';
import { recordingPersistenceService } from '../services/RecordingPersistenceService';

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
  const keepAliveRef = useRef(new BackgroundKeepAliveService());
  const timerRef = useRef(new BackgroundTimer());
  const lastTickTimeRef = useRef<number | null>(null);
  const sensorDataRef = useRef<Omit<TrackPoint, 'timestamp'>>({});

  const startTimestampRef = useRef<number>(Date.now());
  const elapsedSecondsRef = useRef<number>(0);
  const hasRestoredRef = useRef(false);

  const stopTimer = useCallback(() => {
    timerRef.current.stop();
    lastTickTimeRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    lastTickTimeRef.current = performance.now();
    timerRef.current.start(() => {
      const now = performance.now();
      const deltaSeconds = lastTickTimeRef.current !== null
        ? (now - lastTickTimeRef.current) / 1000
        : 1;
      lastTickTimeRef.current = now;

      // Safe clamp to avoid extreme jumps if system sleeps/hibernates
      const effectiveDelta = Math.max(0.1, Math.min(deltaSeconds, 10));

      elapsedSecondsRef.current += 1;
      const newElapsed = elapsedSecondsRef.current;
      setElapsedSeconds(newElapsed);

      const liveData = liveSensorRegistry.getSnapshot();
      const overrideData = sensorDataRef.current;
      // Prioritize live hardware data from LiveSensorRegistry so backgrounding never stalls on stale React state
      const currentData: Omit<TrackPoint, 'timestamp'> = {
        hr: liveData.hr !== undefined ? liveData.hr : overrideData.hr,
        speed: liveData.speed !== undefined ? liveData.speed : overrideData.speed,
        inclination: liveData.inclination !== undefined ? liveData.inclination : overrideData.inclination,
        cadence: liveData.cadence !== undefined ? liveData.cadence : overrideData.cadence,
        power: liveData.power !== undefined ? liveData.power : overrideData.power,
        lat: liveData.lat !== undefined ? liveData.lat : overrideData.lat,
        lng: liveData.lng !== undefined ? liveData.lng : overrideData.lng,
        ele: liveData.ele !== undefined ? liveData.ele : overrideData.ele,
      };
      const tmSpeed = currentData.speed ?? 0;
      const inclination = currentData.inclination ?? 0;
      
      // 1. Calculate Distance & Speed
      let stepDistanceMeters = 0;
      let calculatedSpeedKmH = tmSpeed;

      if (tmSpeed > 0) {
        stepDistanceMeters = (tmSpeed / 3.6) * effectiveDelta;
      } else if (currentData.lat !== undefined && currentData.lng !== undefined) {
        if (prevLatRef.current !== null && prevLngRef.current !== null) {
          stepDistanceMeters = getDistanceMeters(prevLatRef.current, prevLngRef.current, currentData.lat, currentData.lng);
          calculatedSpeedKmH = effectiveDelta > 0 ? (stepDistanceMeters / effectiveDelta) * 3.6 : 0;
        }
      }

      prevLatRef.current = currentData.lat ?? null;
      prevLngRef.current = currentData.lng ?? null;

      currentDistanceRef.current += stepDistanceMeters;
      setRecordedDistanceMeters(currentDistanceRef.current);
      setCurrentSpeed(calculatedSpeedKmH);

      // 2. Calculate Elevation Gain
      let treadmillDelta = 0;
      if (tmSpeed > 0) {
        treadmillDelta = stepDistanceMeters * (inclination / 100);
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

      // Accumulate True Elevation Gain:
      // If running on a treadmill (tmSpeed > 0), strictly accumulate treadmill incline gain (prevents indoor GPS jitter).
      // If moving outdoors via GPS (tmSpeed === 0), strictly accumulate real GPS ascent.
      if (tmSpeed > 0) {
        if (treadmillDelta > 0) cumulativeGainRef.current += treadmillDelta;
      } else {
        if (gpsDelta > 0) cumulativeGainRef.current += gpsDelta;
      }

      recorderRef.current.addDataPoint({
        ...currentData,
        speed: Number(calculatedSpeedKmH.toFixed(2)),
        ele: Number(absoluteEle.toFixed(2)),
      });

      const currentGain = Number(cumulativeGainRef.current.toFixed(1));
      setElevationGain(currentGain);

      // Auto-save full session to localStorage periodically (every 30s) to prevent memory churn & OOM
      if (newElapsed % 30 === 0) {
        recordingPersistenceService.saveSession({
          version: 1,
          recordingState: RecordingState.Recording,
          startTimestamp: startTimestampRef.current,
          lastUpdatedTimestamp: Date.now(),
          elapsedSeconds: newElapsed,
          elevationGain: currentGain,
          recordedDistanceMeters: currentDistanceRef.current,
          simulatedAltitude: simulatedAltitudeRef.current,
          trackPoints: recorderRef.current.trackPoints,
        });
      }
    });
  }, [stopTimer]);

  // Restore saved session on initial mount
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const saved = recordingPersistenceService.loadSession();
    if (saved) {
      console.log('[useRecorder] Restoring saved recording session:', saved);
      recorderRef.current.restoreSession(saved.recordingState, saved.trackPoints);
      setRecordingState(saved.recordingState);
      setElapsedSeconds(saved.elapsedSeconds);
      elapsedSecondsRef.current = saved.elapsedSeconds;
      setElevationGain(saved.elevationGain);
      setRecordedDistanceMeters(saved.recordedDistanceMeters);
      simulatedAltitudeRef.current = saved.simulatedAltitude;
      cumulativeGainRef.current = saved.elevationGain;
      currentDistanceRef.current = saved.recordedDistanceMeters;
      startTimestampRef.current = saved.startTimestamp;

      if (saved.recordingState === RecordingState.Recording) {
        keepAliveRef.current.acquire();
        startTimer();
      }
    }
  }, [startTimer]);

  const start = useCallback(() => {
    startTimestampRef.current = Date.now();
    elapsedSecondsRef.current = 0;
    recorderRef.current.start();
    setRecordingState(RecordingState.Recording);
    setElapsedSeconds(0);
    simulatedAltitudeRef.current = BASE_ELEVATION_METERS;
    cumulativeGainRef.current = 0.0;
    currentDistanceRef.current = 0.0;
    prevGpsAltRef.current = null;
    setElevationGain(0.0);
    setRecordedDistanceMeters(0.0);

    recordingPersistenceService.saveSession({
      version: 1,
      recordingState: RecordingState.Recording,
      startTimestamp: startTimestampRef.current,
      lastUpdatedTimestamp: Date.now(),
      elapsedSeconds: 0,
      elevationGain: 0.0,
      recordedDistanceMeters: 0.0,
      simulatedAltitude: BASE_ELEVATION_METERS,
      trackPoints: [],
    });

    keepAliveRef.current.acquire();
    startTimer();
  }, [startTimer]);

  const pause = useCallback(() => {
    recorderRef.current.pause();
    setRecordingState(RecordingState.Paused);

    recordingPersistenceService.saveSession({
      version: 1,
      recordingState: RecordingState.Paused,
      startTimestamp: startTimestampRef.current,
      lastUpdatedTimestamp: Date.now(),
      elapsedSeconds: elapsedSecondsRef.current,
      elevationGain: Number(cumulativeGainRef.current.toFixed(1)),
      recordedDistanceMeters: currentDistanceRef.current,
      simulatedAltitude: simulatedAltitudeRef.current,
      trackPoints: [...recorderRef.current.trackPoints],
    });

    keepAliveRef.current.release();
    stopTimer();
  }, [stopTimer]);

  const resume = useCallback(() => {
    recorderRef.current.resume();
    setRecordingState(RecordingState.Recording);

    recordingPersistenceService.saveSession({
      version: 1,
      recordingState: RecordingState.Recording,
      startTimestamp: startTimestampRef.current,
      lastUpdatedTimestamp: Date.now(),
      elapsedSeconds: elapsedSecondsRef.current,
      elevationGain: Number(cumulativeGainRef.current.toFixed(1)),
      recordedDistanceMeters: currentDistanceRef.current,
      simulatedAltitude: simulatedAltitudeRef.current,
      trackPoints: [...recorderRef.current.trackPoints],
    });

    keepAliveRef.current.acquire();
    startTimer();
  }, [startTimer]);

  const stop = useCallback(() => {
    recorderRef.current.stop();
    setRecordingState(RecordingState.Stopped);
    keepAliveRef.current.release();
    stopTimer();
  }, [stopTimer]);

  const reset = useCallback(() => {
    recordingPersistenceService.clearSession();
    recorderRef.current.reset();
    setRecordingState(RecordingState.Idle);
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;
    simulatedAltitudeRef.current = BASE_ELEVATION_METERS;
    cumulativeGainRef.current = 0.0;
    currentDistanceRef.current = 0.0;
    prevGpsAltRef.current = null;
    setElevationGain(0.0);
    setRecordedDistanceMeters(0.0);
    sensorDataRef.current = {};
    keepAliveRef.current.release();
    stopTimer();
  }, [stopTimer]);

  const getTrackPoints = useCallback(() => {
    return recorderRef.current.trackPoints;
  }, []);

  const setSensorData = useCallback((data: Omit<TrackPoint, 'timestamp'>) => {
    sensorDataRef.current = data;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const keepAlive = keepAliveRef.current;
    const timer = timerRef.current;
    return () => {
      timer.destroy();
      keepAlive.destroy();
    };
  }, []);

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
