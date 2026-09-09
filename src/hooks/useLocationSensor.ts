import { useState, useCallback, useRef } from 'react';
import { SensorManager } from '../sensors/SensorManager';
import { LocationData } from '../domain/models';
import { liveSensorRegistry } from '../services/LiveSensorRegistry';

export function useLocationSensor() {
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | undefined>(undefined);
  const [isLocationConnected, setIsLocationConnected] = useState(false);
  const sensorManager = useRef(new SensorManager());

  const connectLocation = useCallback(async () => {
    try {
      const sensor = await sensorManager.current.SearchLocationSensor();
      await sensor.start((data) => {
        liveSensorRegistry.updateLocation(data);
        setLocationData(data);
      });

      setLocationName("GPS Location");
      setIsLocationConnected(true);
      console.log(`[Location Sensor] GPS tracking started`);

      // Depending on if the sensor supports onDisconnected
      if (sensor.onDisconnected) {
        sensor.onDisconnected = () => {
          console.log(`[Location Sensor] GPS disconnected`);
          setLocationName(null);
          setIsLocationConnected(false);
          setLocationData(undefined);
          liveSensorRegistry.clearLocation();
        };
      }
    } catch (error) {
      console.error('[Location Sensor] Error connecting to location sensor:', error);
      liveSensorRegistry.clearLocation();
      alert('Error: ' + error);
    }
  }, []);

  const disconnectLocation = useCallback(() => {
    console.log('[Location Sensor] GPS tracking stopped manually');
    const sensor = sensorManager.current.LocationSensor;
    if (sensor) {
      if ((sensor as any).stop) (sensor as any).stop();
      if (sensor.disconnect) sensor.disconnect();
      setLocationName(null);
      setIsLocationConnected(false);
      setLocationData(undefined);
      liveSensorRegistry.clearLocation();
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
