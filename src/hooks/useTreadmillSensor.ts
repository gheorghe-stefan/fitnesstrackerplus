import { useState, useRef, useCallback } from 'react';
import { SensorManager } from '../sensors/SensorManager';
import { TreadmillData } from '../domain/TreadmillData';

const DEFAULT_TREADMILL_DATA: TreadmillData = {
  speed: 0,
  inclination: 4.5,
  rawInclineLevel: 0,
  distance: 0,
  calories: 0,
  heartRate: 0,
  elapsedTime: 0,
};

export interface TreadmillSensorState {
  treadmillName: string | null;
  treadmillData: TreadmillData;
  isTreadmillConnected: boolean;
}

export interface TreadmillSensorActions {
  connectTreadmill: () => Promise<void>;
  disconnectTreadmill: () => void;
}

/**
 * Custom hook wrapping the Treadmill sensor connection lifecycle.
 * Encapsulates SensorManager interaction and state management.
 */
export function useTreadmillSensor(): TreadmillSensorState & TreadmillSensorActions {
  const [treadmillName, setTreadmillName] = useState<string | null>(null);
  const [treadmillData, setTreadmillData] = useState<TreadmillData>(DEFAULT_TREADMILL_DATA);
  const [isTreadmillConnected, setIsTreadmillConnected] = useState(false);
  const sensorManagerRef = useRef(new SensorManager());

  const connectTreadmill = useCallback(async () => {
    try {
      const sensor = await sensorManagerRef.current.SearchTreadmillSensor();
      setTreadmillName(sensor.name);
      setIsTreadmillConnected(true);
      console.log(`[Treadmill Sensor] Connected to: ${sensor.name}`);

      sensor.onDisconnected = () => {
        console.log(`[Treadmill Sensor] Disconnected (device event)`);
        setTreadmillName(null);
        setTreadmillData(DEFAULT_TREADMILL_DATA);
        setIsTreadmillConnected(false);
      };

      await sensor.start((data: TreadmillData) => {
        setTreadmillData(data);
      });
    } catch (error) {
      console.error('[Treadmill Sensor] Failed to connect:', error);
      setTreadmillName(null);
      setTreadmillData(DEFAULT_TREADMILL_DATA);
      setIsTreadmillConnected(false);
    }
  }, []);

  const disconnectTreadmill = useCallback(() => {
    console.log('[Treadmill Sensor] Disconnecting manually');
    sensorManagerRef.current.TreadmillSensor?.disconnect();
    setTreadmillName(null);
    setTreadmillData(DEFAULT_TREADMILL_DATA);
    setIsTreadmillConnected(false);
  }, []);

  return {
    treadmillName,
    treadmillData,
    isTreadmillConnected,
    connectTreadmill,
    disconnectTreadmill,
  };
}
