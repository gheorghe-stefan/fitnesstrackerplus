import { useState, useRef, useCallback } from 'react';
import { SensorManager } from '../sensors/SensorManager';

export interface HeartRateSensorState {
  sensorName: string | null;
  heartRate: number;
  isConnected: boolean;
}

export interface HeartRateSensorActions {
  connect: () => Promise<void>;
  disconnect: () => void;
}

/**
 * Custom hook wrapping the HR sensor connection lifecycle.
 * Encapsulates SensorManager interaction and state management.
 */
export function useHeartRateSensor(): HeartRateSensorState & HeartRateSensorActions {
  const [sensorName, setSensorName] = useState<string | null>(null);
  const [heartRate, setHeartRate] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const sensorManagerRef = useRef(new SensorManager());

  const connect = useCallback(async () => {
    try {
      const sensor = await sensorManagerRef.current.SearchHRSensor();
      setSensorName(sensor.name);
      setIsConnected(true);

      sensor.onDisconnected = () => {
        setSensorName(null);
        setHeartRate(0);
        setIsConnected(false);
      };

      await sensor.start((hr: number) => {
        setHeartRate(hr);
      });
    } catch (error) {
      console.error('Failed to connect HR sensor:', error);
      setSensorName(null);
      setHeartRate(0);
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    sensorManagerRef.current.HRSensor?.disconnect();
    setSensorName(null);
    setHeartRate(0);
    setIsConnected(false);
  }, []);

  return { sensorName, heartRate, isConnected, connect, disconnect };
}
