import React from 'react';
import { formatTime } from '../services/TimeFormatter';
import { TreadmillData } from '../domain/TreadmillData';

export interface DataDisplayProps {
  heartRate: number;
  isConnected: boolean;
  elapsedSeconds: number;
  treadmillData?: TreadmillData;
  isTreadmillConnected?: boolean;
  elevationGain?: number;
  recordedDistanceMeters?: number;
}

/**
 * Displays live sensor metrics, activity timer, and elevation gain.
 * Glassmorphism cards structured in a clean 2-column grid.
 */
export const DataDisplay: React.FC<DataDisplayProps> = ({
  heartRate,
  isConnected,
  elapsedSeconds,
  treadmillData,
  isTreadmillConnected = false,
  elevationGain = 0.0,
  recordedDistanceMeters = 0.0,
}) => {
  const speedDisplay = isTreadmillConnected && treadmillData
    ? treadmillData.speed.toFixed(1)
    : '--';

  const inclineDisplay = isTreadmillConnected && treadmillData
    ? `${treadmillData.inclination.toFixed(1)}%`
    : '--';

  const inclineLevelSub = isTreadmillConnected && treadmillData
    ? `Level ${treadmillData.rawInclineLevel}`
    : '';

  const distanceKmDisplay = isTreadmillConnected
    ? (Math.floor(recordedDistanceMeters) / 1000).toFixed(3)
    : '--';

  const elevationDisplay = elevationGain > 0
    ? `+${elevationGain.toFixed(1)}`
    : '+0.0';

  return (
    <div className="data-display">
      {/* Heart Rate Card */}
      <div className="metric-card hr-card">
        <div className="metric-label">Heart Rate</div>
        <div className="metric-value-container">
          <span className={`metric-value hr-value ${isConnected && heartRate > 0 ? 'active' : ''}`}>
            {isConnected ? (heartRate > 0 ? heartRate : '--') : '--'}
          </span>
          <span className="metric-unit">bpm</span>
        </div>
      </div>

      {/* Speed Card */}
      <div className="metric-card speed-card">
        <div className="metric-label">Speed</div>
        <div className="metric-value-container">
          <span className={`metric-value speed-value ${isTreadmillConnected ? 'active' : ''}`}>
            {speedDisplay}
          </span>
          <span className="metric-unit">km/h</span>
        </div>
      </div>

      {/* Incline Card */}
      <div className="metric-card incline-card">
        <div className="metric-label">Incline Grade</div>
        <div className="metric-value-container">
          <span className={`metric-value incline-value ${isTreadmillConnected ? 'active' : ''}`}>
            {inclineDisplay}
          </span>
        </div>
        {inclineLevelSub && <div className="metric-sublabel">{inclineLevelSub}</div>}
      </div>

      {/* Elevation Gain Card */}
      <div className="metric-card elevation-card">
        <div className="metric-label">Elevation Gain</div>
        <div className="metric-value-container">
          <span className={`metric-value elevation-value ${elevationGain > 0 ? 'active' : ''}`}>
            {elevationDisplay}
          </span>
          <span className="metric-unit">m</span>
        </div>
      </div>

      {/* Duration Card */}
      <div className="metric-card timer-card">
        <div className="metric-label">Duration</div>
        <div className="metric-value-container">
          <span className="metric-value timer-value">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Distance Card */}
      <div className="metric-card distance-card">
        <div className="metric-label">Distance</div>
        <div className="metric-value-container">
          <span className={`metric-value distance-value ${isTreadmillConnected ? 'active' : ''}`}>
            {distanceKmDisplay}
          </span>
          <span className="metric-unit">km</span>
        </div>
      </div>
    </div>
  );
};
