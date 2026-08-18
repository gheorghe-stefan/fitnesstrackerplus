import React from 'react';
import { IconButton, Tooltip, Button } from '@mui/material';
import { Favorite, HeartBroken, FitnessCenter } from '@mui/icons-material';
import { StravaAuthentication } from '../strava/StravaModels';
import stravaConnectBtn from '../assets/strava/btn_connect_orange.png';

export interface HeaderProps {
  sensorName: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  treadmillName?: string | null;
  onConnectTreadmill?: () => void;
  onDisconnectTreadmill?: () => void;
  stravaAuth?: StravaAuthentication | null;
  onConnectStrava?: () => void;
  onDisconnectStrava?: () => void;
  isStravaConnecting?: boolean;
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
  stravaAuth,
  onConnectStrava,
  onDisconnectStrava,
  isStravaConnecting = false,
}) => {
  const isHrConnected = sensorName !== null;
  const isTreadmillConnected = treadmillName !== null;

  return (
    <header className="App-header">
      <div className="header-left">
        <img
          src={`${process.env.PUBLIC_URL}/logo.png`}
          alt="FitnessTracker+ App Icon"
          className="app-header-logo-icon"
        />
        <h1 className="App-title-logo">FitnessTracker<span className="title-plus">+</span></h1>
      </div>
      <div className="header-right">
        {/* Settings Portal Container */}
        <div id="header-settings-portal" style={{ display: 'flex', alignItems: 'center', marginRight: '8px' }} />

        {/* Strava Control */}
        {onConnectStrava && onDisconnectStrava && (
          <div className="strava-header-control">
            {stravaAuth ? (
              <>
                <span className="sensor-name strava-name">
                  Strava: {stravaAuth.athlete.firstname}
                </span>
                <Button 
                  size="small" 
                  color="inherit" 
                  variant="outlined" 
                  onClick={onDisconnectStrava}
                  sx={{ ml: 1, borderColor: '#fc5200', color: '#fc5200', padding: '2px 8px' }}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <button
                  type="button"
                  onClick={!isStravaConnecting ? onConnectStrava : undefined}
                  disabled={isStravaConnecting}
                  className="strava-connect-btn-wrapper"
              >
                  <img
                      src={stravaConnectBtn}
                      alt="Connect with Strava"
                      className={`strava-connect-btn ${isStravaConnecting ? 'connecting' : ''}`}
                  />
              </button>
            )}
          </div>
        )}

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
