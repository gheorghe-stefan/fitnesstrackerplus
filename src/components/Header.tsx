import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Favorite, HeartBroken } from '@mui/icons-material';

export interface HeaderProps {
  sensorName: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

/**
 * App header with title and HR sensor connect/disconnect button.
 * Shows a pulsing heart icon when connected, broken heart when disconnected.
 */
export const Header: React.FC<HeaderProps> = ({ sensorName, onConnect, onDisconnect }) => {
  const isConnected = sensorName !== null;

  return (
    <header className="App-header">
      <div className="header-left">
        <h1 className="App-title-logo">FitnessTracker<span className="title-plus">+</span></h1>
      </div>
      <div className="header-right">
        {isConnected && (
          <span className="sensor-name">{sensorName}</span>
        )}
        {isConnected ? (
          <Tooltip title={`Disconnect ${sensorName}`}>
            <IconButton className="button hr-button connected" onClick={onDisconnect} id="btn-hr-disconnect">
              <Favorite className="hr-icon pulse" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Connect heart rate sensor">
            <IconButton className="button hr-button disconnected" onClick={onConnect} id="btn-hr-connect">
              <HeartBroken className="hr-icon" />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </header>
  );
};
