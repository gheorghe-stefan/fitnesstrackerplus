import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Favorite, HeartBroken, FitnessCenter } from '@mui/icons-material';

export interface HeaderProps {
  sensorName: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  treadmillName?: string | null;
  onConnectTreadmill?: () => void;
  onDisconnectTreadmill?: () => void;
}

/**
 * App header with title, HR sensor, and Treadmill connect/disconnect buttons.
 */
export const Header: React.FC<HeaderProps> = ({
  sensorName,
  onConnect,
  onDisconnect,
  treadmillName = null,
  onConnectTreadmill,
  onDisconnectTreadmill,
}) => {
  const isHrConnected = sensorName !== null;
  const isTreadmillConnected = treadmillName !== null;

  return (
    <header className="App-header">
      <div className="header-left">
        <h1 className="App-title-logo">FitnessTracker<span className="title-plus">+</span></h1>
      </div>
      <div className="header-right">
        {/* Heart Rate Sensor Control */}
        {isHrConnected && (
          <span className="sensor-name">{sensorName}</span>
        )}
        {isHrConnected ? (
          <Tooltip title={`Disconnect HR (${sensorName})`}>
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

        {/* Treadmill Sensor Control */}
        {onConnectTreadmill && onDisconnectTreadmill && (
          <>
            {isTreadmillConnected && (
              <span className="sensor-name treadmill-name">{treadmillName}</span>
            )}
            {isTreadmillConnected ? (
              <Tooltip title={`Disconnect Treadmill (${treadmillName})`}>
                <IconButton
                  className="button treadmill-button connected"
                  onClick={onDisconnectTreadmill}
                  id="btn-treadmill-disconnect"
                >
                  <FitnessCenter className="treadmill-icon active" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Connect treadmill (FTMS)">
                <IconButton
                  className="button treadmill-button disconnected"
                  onClick={onConnectTreadmill}
                  id="btn-treadmill-connect"
                >
                  <FitnessCenter className="treadmill-icon" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </div>
    </header>
  );
};
