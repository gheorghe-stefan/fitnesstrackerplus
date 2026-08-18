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

      sensor.onDisconnected = () => {
        setPowerName(null);
        setIsPowerConnected(false);
        setPowerData(undefined);
      };
    } catch (error) {
      console.error('Error connecting to power sensor:', error);
    }
  }, []);

  const disconnectPower = useCallback(() => {
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
