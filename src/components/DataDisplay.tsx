import React from 'react';
import { formatTime } from '../services/TimeFormatter';
import { TreadmillData } from '../domain/TreadmillData';

export interface DataDisplayProps {
  heartRate: number;
  isConnected: boolean;
  elapsedSeconds: number;
  treadmillData?: TreadmillData;
  isTreadmillConnected?: boolean;
}

/**
 * Displays live sensor metrics and the activity timer.
 * Glassmorphism cards with glowing accent when sensor data is active.
 */
export const DataDisplay: React.FC<DataDisplayProps> = ({
  heartRate,
  isConnected,
  elapsedSeconds,
  treadmillData,
  isTreadmillConnected = false,
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

  const distanceKmDisplay = isTreadmillConnected && treadmillData
    ? (treadmillData.distance / 1000).toFixed(2)
    : '--';

  const caloriesDisplay = isTreadmillConnected && treadmillData
    ? treadmillData.calories.toString()
    : '--';

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

      {/* Calories Card */}
      <div className="metric-card calories-card">
        <div className="metric-label">Calories</div>
        <div className="metric-value-container">
          <span className={`metric-value calories-value ${isTreadmillConnected ? 'active' : ''}`}>
            {caloriesDisplay}
          </span>
          <span className="metric-unit">kcal</span>
        </div>
      </div>
    </div>
  );
};
