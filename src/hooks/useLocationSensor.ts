import { useState, useCallback, useRef } from 'react';
import { SensorManager } from '../sensors/SensorManager';
import { LocationData } from '../domain/models';

export function useLocationSensor() {
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | undefined>(undefined);
  const [isLocationConnected, setIsLocationConnected] = useState(false);
  const sensorManager = useRef(new SensorManager());

  const connectLocation = useCallback(async () => {
    try {
      const sensor = await sensorManager.current.SearchLocationSensor();
      await sensor.start((data) => {
        setLocationData(data);
      });

      setLocationName("GPS Location");
      setIsLocationConnected(true);

      // Depending on if the sensor supports onDisconnected
      if (sensor.onDisconnected) {
        sensor.onDisconnected = () => {
          setLocationName(null);
          setIsLocationConnected(false);
          setLocationData(undefined);
        };
      }
    } catch (error) {
      console.error('Error connecting to location sensor:', error);
      alert('Error: ' + error);
    }
  }, []);

  const disconnectLocation = useCallback(() => {
    const sensor = sensorManager.current.LocationSensor;
    if (sensor) {
      if ((sensor as any).stop) (sensor as any).stop();
      if (sensor.disconnect) sensor.disconnect();
      setLocationName(null);
      setIsLocationConnected(false);
      setLocationData(undefined);
    }
  }, []);

  return {
    locationName,
    locationData,
    isLocationConnected,
    connectLocation,
    disconnectLocation,
  };
}
