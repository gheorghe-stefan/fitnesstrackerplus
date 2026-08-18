import React from 'react';
import { IconButton, Tooltip, Button } from '@mui/material';
import { MonitorHeart, HeartBroken, DirectionsRun, Bolt } from '@mui/icons-material';
import { StravaAuthentication } from '../strava/StravaModels';
import stravaConnectBtn from '../assets/strava/btn_connect_orange.png';

export interface HeaderProps {
  sensorName: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  treadmillName?: string | null;
  onConnectTreadmill?: () => void;
  onDisconnectTreadmill?: () => void;
  powerName?: string | null;
  onConnectPower?: () => void;
  onDisconnectPower?: () => void;
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
  powerName = null,
  onConnectPower,
  onDisconnectPower,
  stravaAuth,
  onConnectStrava,
  onDisconnectStrava,
  isStravaConnecting = false,
}) => {
  const isHrConnected = sensorName !== null;
  const isTreadmillConnected = treadmillName !== null;
  const isPowerConnected = powerName !== null;

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
              <MonitorHeart className="hr-icon pulse" />
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
                  <DirectionsRun className="treadmill-icon active" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Connect treadmill (FTMS)">
                <IconButton
                  className="button treadmill-button disconnected"
                  onClick={onConnectTreadmill}
                  id="btn-treadmill-connect"
                >
                  <DirectionsRun className="treadmill-icon" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}

        {/* Power Sensor Control */}
        {onConnectPower && onDisconnectPower && (
          <>
            {isPowerConnected && (
              <span className="sensor-name power-name" style={{ background: 'rgba(255, 193, 7, 0.15)', borderColor: 'rgba(255, 193, 7, 0.35)', color: '#ffc107' }}>{powerName}</span>
            )}
            {isPowerConnected ? (
              <Tooltip title={`Disconnect Power Meter (${powerName})`}>
                <IconButton
                  className="button power-button connected"
                  style={{ background: 'linear-gradient(145deg, #ffc107, #ff9800)', boxShadow: '0 0 20px rgba(255, 193, 7, 0.4)' }}
                  onClick={onDisconnectPower}
                  id="btn-power-disconnect"
                >
                  <Bolt className="power-icon active" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Connect Power Meter (BLE)">
                <IconButton
                  className="button treadmill-button disconnected"
                  onClick={onConnectPower}
                  id="btn-power-connect"
                >
                  <Bolt className="power-icon" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </div>
    </header>
  );
};
