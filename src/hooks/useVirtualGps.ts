import { useState, useRef, useCallback } from 'react';
import { VirtualGpsConfig } from '../domain/VirtualGpsModels';
import { VirtualGpsService } from '../services/VirtualGpsService';

export interface VirtualGpsState {
  gpsConfig: VirtualGpsConfig;
  isGpsModalOpen: boolean;
}

export interface VirtualGpsActions {
  openGpsModal: () => void;
  closeGpsModal: () => void;
  updateGpsConfig: (newConfig: Partial<VirtualGpsConfig>) => void;
  computeStepData: (speedKmH: number, inclinePercent: number, deltaTimeSec?: number) => { lat: number; lon: number; ele: number };
  resetGpsSession: () => void;
}

/**
 * Custom React hook encapsulating VirtualGpsService lifecycle, UI dialog state, and config storage.
 */
export function useVirtualGps(): VirtualGpsState & VirtualGpsActions {
  const gpsServiceRef = useRef(new VirtualGpsService());
  const [gpsConfig, setGpsConfig] = useState<VirtualGpsConfig>(gpsServiceRef.current.getConfig());
  const [isGpsModalOpen, setIsGpsModalOpen] = useState(false);

  const openGpsModal = useCallback(() => setIsGpsModalOpen(true), []);
  const closeGpsModal = useCallback(() => setIsGpsModalOpen(false), []);

  const updateGpsConfig = useCallback((newConfig: Partial<VirtualGpsConfig>) => {
    gpsServiceRef.current.updateConfig(newConfig);
    setGpsConfig(gpsServiceRef.current.getConfig());
  }, []);

  const computeStepData = useCallback(
    (speedKmH: number, inclinePercent: number, deltaTimeSec: number = 1) => {
      return gpsServiceRef.current.computeStepData(speedKmH, inclinePercent, deltaTimeSec);
    },
    []
  );

  const resetGpsSession = useCallback(() => {
    gpsServiceRef.current.resetSession();
  }, []);

  return {
    gpsConfig,
    isGpsModalOpen,
    openGpsModal,
    closeGpsModal,
    updateGpsConfig,
    computeStepData,
    resetGpsSession,
  };
}
