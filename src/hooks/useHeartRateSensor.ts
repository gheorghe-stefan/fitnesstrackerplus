import { useState, useRef, useCallback, useEffect } from 'react';
import { SensorManager } from '../sensors/SensorManager';
import { ISensor } from '../domain/ISensor';
import { liveSensorRegistry } from '../services/LiveSensorRegistry';

export interface HeartRateDeviceInfo {
  id: string;
  name: string;
  heartRate: number;
  isActive: boolean;
}

export interface HeartRateSensorState {
  sensorName: string | null;
  heartRate: number;
  isConnected: boolean;
  devices: HeartRateDeviceInfo[];
}

export interface HeartRateSensorActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  disconnectDevice: (id: string) => void;
  setActiveDevice: (id: string) => void;
}

interface ConnectedSensorEntry {
  id: string;
  name: string;
  sensor: ISensor<number>;
  heartRate: number;
}

/**
 * Custom hook wrapping the HR sensor connection lifecycle.
 * Supports multiple simultaneous HR sensor connections with primary selection and failover.
 */
export function useHeartRateSensor(): HeartRateSensorState & HeartRateSensorActions {
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [devicesList, setDevicesList] = useState<HeartRateDeviceInfo[]>([]);
  const connectedMapRef = useRef<Map<string, ConnectedSensorEntry>>(new Map());
  const activeIdRef = useRef<string | null>(null);

  const syncState = useCallback(() => {
    const list: HeartRateDeviceInfo[] = [];
    let currentActiveId = activeIdRef.current;

    // Verify activeId is still valid
    if (currentActiveId && !connectedMapRef.current.has(currentActiveId)) {
      currentActiveId = null;
    }

    // Auto-failover: if active device dropped and other devices exist, pick the first
    if (!currentActiveId && connectedMapRef.current.size > 0) {
      currentActiveId = connectedMapRef.current.keys().next().value;
    }

    activeIdRef.current = currentActiveId;
    setActiveDeviceId(currentActiveId);

    if (currentActiveId && connectedMapRef.current.has(currentActiveId)) {
      const active = connectedMapRef.current.get(currentActiveId);
      if (active && active.heartRate > 0) {
        liveSensorRegistry.updateHeartRate(active.heartRate);
      }
    } else {
      liveSensorRegistry.clearHeartRate();
    }

    connectedMapRef.current.forEach((entry) => {
      list.push({
        id: entry.id,
        name: entry.name,
        heartRate: entry.heartRate,
        isActive: entry.id === currentActiveId,
      });
    });

    setDevicesList(list);
  }, []);

  const connect = useCallback(async () => {
    try {
      const manager = new SensorManager();
      const sensor = await manager.SearchHRSensor();
      const deviceId = sensor.id || sensor.name;

      // Duplicate prevention: if already connected, just make it active
      if (connectedMapRef.current.has(deviceId)) {
        console.log(`[HR Sensor] Sensor already connected: ${sensor.name}. Setting as active.`);
        activeIdRef.current = deviceId;
        syncState();
        return;
      }

      console.log(`[HR Sensor] Connected to: ${sensor.name} (id: ${deviceId})`);

      const entry: ConnectedSensorEntry = {
        id: deviceId,
        name: sensor.name,
        sensor,
        heartRate: 0,
      };

      connectedMapRef.current.set(deviceId, entry);

      // Default new sensor to active
      activeIdRef.current = deviceId;

      sensor.onDisconnected = () => {
        console.log(`[HR Sensor] Disconnected (device event): ${entry.name}`);
        connectedMapRef.current.delete(deviceId);
        syncState();
      };

      await sensor.start((hr: number) => {
        const currentEntry = connectedMapRef.current.get(deviceId);
        if (currentEntry) {
          currentEntry.heartRate = hr;
          if (activeIdRef.current === deviceId && hr > 0) {
            liveSensorRegistry.updateHeartRate(hr);
          }
          syncState();
        }
      });

      syncState();
    } catch (error) {
      console.error('[HR Sensor] Failed to connect:', error);
      syncState();
    }
  }, [syncState]);

  const disconnectDevice = useCallback((id: string) => {
    console.log(`[HR Sensor] Disconnecting device manually: ${id}`);
    const entry = connectedMapRef.current.get(id);
    if (entry) {
      entry.sensor.disconnect();
      connectedMapRef.current.delete(id);
      syncState();
    }
  }, [syncState]);

  const disconnect = useCallback(() => {
    console.log('[HR Sensor] Disconnecting all HR devices');
    connectedMapRef.current.forEach((entry) => {
      try {
        entry.sensor.disconnect();
      } catch (err) {
        console.warn('Error disconnecting HR device:', err);
      }
    });
    connectedMapRef.current.clear();
    activeIdRef.current = null;
    syncState();
  }, [syncState]);

  const setActiveDevice = useCallback((id: string) => {
    if (connectedMapRef.current.has(id)) {
      console.log(`[HR Sensor] Switched active device to: ${id}`);
      activeIdRef.current = id;
      syncState();
    }
  }, [syncState]);

  const activeEntry = activeDeviceId ? connectedMapRef.current.get(activeDeviceId) : null;
  const sensorName = activeEntry ? activeEntry.name : null;
  const heartRate = activeEntry ? activeEntry.heartRate : 0;
  const isConnected = connectedMapRef.current.size > 0;

  useEffect(() => {
    const map = connectedMapRef.current;
    return () => {
      map.forEach((entry) => {
        try {
          entry.sensor.disconnect();
        } catch {
          // Ignore unmount error
        }
      });
      map.clear();
      liveSensorRegistry.clearHeartRate();
    };
  }, []);

  return {
    sensorName,
    heartRate,
    isConnected,
    devices: devicesList,
    connect,
    disconnect,
    disconnectDevice,
    setActiveDevice,
  };
}

