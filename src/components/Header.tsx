import React from 'react';
import { IconButton, Tooltip, Button } from '@mui/material';
import { MonitorHeart, DirectionsRun, Bolt, SatelliteAlt } from '@mui/icons-material';
import { StravaAuthentication } from '../strava/StravaModels';
import { SensorMenuPopover, SensorDeviceInfo } from './SensorMenuPopover';
import { StravaMenuPopover } from './StravaMenuPopover';
import stravaConnectBtn from '../assets/strava/btn_connect_orange.png';

export interface HeaderProps {
  sensorName: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  hrDevices?: Array<{ id: string; name: string; heartRate: number; isActive: boolean }>;
  onSelectActiveHr?: (id: string) => void;
  onDisconnectHrDevice?: (id: string) => void;
  treadmillName?: string | null;
  onConnectTreadmill?: () => void;
  onDisconnectTreadmill?: () => void;
  powerName?: string | null;
  onConnectPower?: () => void;
  onDisconnectPower?: () => void;
  locationName?: string | null;
  onConnectLocation?: () => void;
  onDisconnectLocation?: () => void;
  stravaAuth?: StravaAuthentication | null;
  stravaAccounts?: StravaAuthentication[];
  activeStravaAthleteId?: number | null;
  onSelectStravaAccount?: (athleteId: number) => void;
  onRemoveStravaAccount?: (athleteId: number) => void;
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
  hrDevices = [],
  onSelectActiveHr,
  onDisconnectHrDevice,
  treadmillName = null,
  onConnectTreadmill,
  onDisconnectTreadmill,
  powerName = null,
  onConnectPower,
  onDisconnectPower,
  locationName = null,
  onConnectLocation,
  onDisconnectLocation,
  stravaAuth,
  stravaAccounts = [],
  activeStravaAthleteId,
  onSelectStravaAccount,
  onRemoveStravaAccount,
  onConnectStrava,
  onDisconnectStrava,
  isStravaConnecting = false,
}) => {
  const isHrConnected = sensorName !== null;
  const isTreadmillConnected = treadmillName !== null;
  const isPowerConnected = powerName !== null;
  const isLocationConnected = locationName !== null;

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
            {stravaAccounts && stravaAccounts.length > 0 ? (
              <StravaMenuPopover
                accounts={stravaAccounts}
                activeAthleteId={activeStravaAthleteId ?? stravaAuth?.athlete.id ?? null}
                onSelectAccount={onSelectStravaAccount || (() => {})}
                onRemoveAccount={onRemoveStravaAccount || (() => {})}
                onConnectNew={onConnectStrava}
                onDisconnectAll={onDisconnectStrava}
              />
            ) : stravaAuth ? (
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
        {isHrConnected && hrDevices && hrDevices.length > 0 ? (
          <SensorMenuPopover
            categoryTitle="Heart Rate Sources"
            activeColor="var(--accent-red)"
            devices={hrDevices.map((d): SensorDeviceInfo => ({
              id: d.id,
              name: d.name,
              displayValue: d.heartRate > 0 ? `${d.heartRate} bpm` : '-- bpm',
              isActive: d.isActive,
            }))}
            activeDeviceName={sensorName}
            onSelectActive={onSelectActiveHr || (() => {})}
            onDisconnectDevice={onDisconnectHrDevice || onDisconnect}
            onConnectNew={onConnect}
            onDisconnectAll={onDisconnect}
          />
        ) : isHrConnected ? (
          <span className="sensor-name">{sensorName}</span>
        ) : null}

        {isHrConnected ? (
          <Tooltip title={`Heart Rate Connected (${sensorName})`}>
            <IconButton className="button hr-button connected" onClick={onDisconnect} id="btn-hr-disconnect">
              <MonitorHeart className="hr-icon pulse" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Connect heart rate sensor">
            <IconButton className="button sensor-button disconnected" onClick={onConnect} id="btn-hr-connect">
              <MonitorHeart className="hr-icon" />
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
                  className="button sensor-button disconnected"
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
                  <Bolt className="power-icon active" style={{ color: '#fff' }} />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Connect Power Meter (BLE)">
                <IconButton
                  className="button sensor-button disconnected"
                  onClick={onConnectPower}
                  id="btn-power-connect"
                >
                  <Bolt className="power-icon" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}

        {/* Location Sensor Control */}
        {onConnectLocation && onDisconnectLocation && (
          <>
            {isLocationConnected && (
              <span className="sensor-name location-name" style={{ background: 'rgba(33, 150, 243, 0.15)', borderColor: 'rgba(33, 150, 243, 0.35)', color: '#2196f3' }}>{locationName}</span>
            )}
            {isLocationConnected ? (
              <Tooltip title={`Disconnect GPS (${locationName})`}>
                <IconButton
                  className="button location-button connected"
                  style={{ background: 'linear-gradient(145deg, #2196f3, #1976d2)', boxShadow: '0 0 20px rgba(33, 150, 243, 0.4)' }}
                  onClick={onDisconnectLocation}
                  id="btn-location-disconnect"
                >
                  <SatelliteAlt className="location-icon active" style={{ color: '#fff' }} />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Enable GPS Location">
                <IconButton
                  className="button sensor-button disconnected"
                  onClick={onConnectLocation}
                  id="btn-location-connect"
                >
                  <SatelliteAlt className="location-icon" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </div>
    </header>
  );
};
