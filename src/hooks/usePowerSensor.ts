import { useState, useCallback, useRef } from 'react';
import { SensorManager } from '../sensors/SensorManager';
import { PowerData } from '../domain/PowerData';

export function usePowerSensor() {
  const [powerName, setPowerName] = useState<string | null>(null);
  const [powerData, setPowerData] = useState<PowerData | undefined>(undefined);
  const [isPowerConnected, setIsPowerConnected] = useState(false);
  const sensorManager = useRef(new SensorManager());

  const connectPower = useCallback(async () => {
    try {
      const sensor = await sensorManager.current.SearchPowerSensor();
      await sensor.start((data) => {
        setPowerData(data);
      });

      setPowerName(sensor.name);
      setIsPowerConnected(true);
      console.log(`[Power Sensor] Connected to: ${sensor.name}`);

      sensor.onDisconnected = () => {
        console.log(`[Power Sensor] Disconnected (device event)`);
        setPowerName(null);
        setIsPowerConnected(false);
        setPowerData(undefined);
      };
    } catch (error) {
      console.error('[Power Sensor] Error connecting to power sensor:', error);
    }
  }, []);

  const disconnectPower = useCallback(() => {
    console.log('[Power Sensor] Disconnecting manually');
    const sensor = sensorManager.current.PowerSensor;
    if (sensor) {
      sensor.disconnect();
      setPowerName(null);
      setIsPowerConnected(false);
      setPowerData(undefined);
    }
  }, []);

  return {
    powerName,
    powerData,
    isPowerConnected,
    connectPower,
    disconnectPower,
  };
}
