import React from 'react';
import { formatTime } from '../services/TimeFormatter';

export interface DataDisplayProps {
  heartRate: number;
  isConnected: boolean;
  elapsedSeconds: number;
}

/**
 * Displays live sensor metrics and the activity timer.
 * Glassmorphism cards with glowing accent when HR data is active.
 */
export const DataDisplay: React.FC<DataDisplayProps> = ({ heartRate, isConnected, elapsedSeconds }) => {
  return (
    <div className="data-display">
      <div className="metric-card hr-card">
        <div className="metric-label">Heart Rate</div>
        <div className="metric-value-container">
          <span className={`metric-value hr-value ${isConnected && heartRate > 0 ? 'active' : ''}`}>
            {isConnected ? (heartRate > 0 ? heartRate : '--') : '--'}
          </span>
          <span className="metric-unit">bpm</span>
        </div>
      </div>
      <div className="metric-card timer-card">
        <div className="metric-label">Duration</div>
        <div className="metric-value-container">
          <span className="metric-value timer-value">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>
    </div>
  );
};
