import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { saveAs } from 'file-saver';
import { useHeartRateSensor } from './hooks/useHeartRateSensor';
import { useTreadmillSensor } from './hooks/useTreadmillSensor';
import { usePowerSensor } from './hooks/usePowerSensor';
import { useLocationSensor } from './hooks/useLocationSensor';
import { useRecorder } from './hooks/useRecorder';
import { useStrava } from './hooks/useStrava';
import { Header } from './components/Header';
import { DataDisplay } from './components/DataDisplay';
import { RecordingControls } from './components/RecordingControls';
import { SaveDialog } from './components/SaveDialog';
import { DebugPanel } from './components/DebugPanel';
import { TcxExporter } from './services/TcxExporter';
import { formatTime } from './services/TimeFormatter';
import { RecordingState } from './domain/models';
import './App.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7cb342' },
    error: { main: '#ef5350' },
    background: { default: '#1a1a2e', paper: '#16213e' },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
  },
});

const defaultExporter = new TcxExporter();

/**
 * Root application shell — thin composition layer.
 * Wires sensors and recorder to presentational components.
 * All business logic lives in hooks and services.
 */
const App: React.FC = () => {
  const {
    sensorName,
    heartRate,
    isConnected,
    devices: hrDevices,
    connect,
    disconnect,
    disconnectDevice: disconnectHrDevice,
    setActiveDevice: setActiveHrDevice,
  } = useHeartRateSensor();
  const {
    treadmillName,
    treadmillData,
    isTreadmillConnected,
    connectTreadmill,
    disconnectTreadmill,
  } = useTreadmillSensor();
  const {
    powerName,
    powerData,
    isPowerConnected,
    connectPower,
    disconnectPower,
  } = usePowerSensor();
  const {
    locationName,
    locationData,
    isLocationConnected,
    connectLocation,
    disconnectLocation,
  } = useLocationSensor();
  const {
    stravaAuth,
    isConnecting: isStravaConnecting,
    connect: connectStrava,
    disconnect: disconnectStrava
  } = useStrava();

  const {
    recordingState, elapsedSeconds, elevationGain, recordedDistanceMeters, currentSpeed,
    start, pause, resume, stop, reset,
    getTrackPoints, setSensorData,
  } = useRecorder();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Keep combined sensor data ref up to date for the recorder's interval callback
  useEffect(() => {
    // HR priority: standalone HR sensor first, treadmill HR fallback
    const effectiveHr = isConnected && heartRate > 0
      ? heartRate
      : (isTreadmillConnected && treadmillData.heartRate > 0 ? treadmillData.heartRate : undefined);

    const speed = isTreadmillConnected ? treadmillData.speed : 0;
    const inclination = isTreadmillConnected ? treadmillData.inclination : 4.5;

    setSensorData({
      hr: effectiveHr,
      speed: isTreadmillConnected ? speed : undefined,
      inclination: isTreadmillConnected ? inclination : undefined,
      cadence: isPowerConnected && powerData ? powerData.cadence : undefined,
      power: isPowerConnected && powerData ? powerData.power : undefined,
      lat: isLocationConnected && locationData ? locationData.latitude : undefined,
      lng: isLocationConnected && locationData ? locationData.longitude : undefined,
      ele: isLocationConnected && locationData ? locationData.altitude : undefined,
    });
  }, [heartRate, isConnected, treadmillData, isTreadmillConnected, powerData, isPowerConnected, locationData, isLocationConnected, setSensorData]);

  const handleStart = () => {
    start();
  };
  const handlePause = () => pause();
  const handleResume = () => resume();

  const handleStop = () => {
    stop();
    setDialogOpen(true);
  };

  const handleSave = () => {
    const points = getTrackPoints();
    const tcxContent = defaultExporter.export(points);
    const blob = new Blob([tcxContent], { type: defaultExporter.mimeType });
    const filename = `activity_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.${defaultExporter.extension}`;
    saveAs(blob, filename);
    reset();
    setDialogOpen(false);
  };

  const handleDiscard = () => {
    reset();
    setDialogOpen(false);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="App">
        <Header
          sensorName={sensorName}
          onConnect={connect}
          onDisconnect={disconnect}
          hrDevices={hrDevices}
          onSelectActiveHr={setActiveHrDevice}
          onDisconnectHrDevice={disconnectHrDevice}
          treadmillName={treadmillName}
          onConnectTreadmill={connectTreadmill}
          onDisconnectTreadmill={disconnectTreadmill}
          powerName={powerName}
          onConnectPower={connectPower}
          onDisconnectPower={disconnectPower}
          locationName={locationName}
          onConnectLocation={connectLocation}
          onDisconnectLocation={disconnectLocation}
          stravaAuth={stravaAuth}
          isStravaConnecting={isStravaConnecting}
          onConnectStrava={connectStrava}
          onDisconnectStrava={disconnectStrava}
        />
        <main className="App-content">
          <DataDisplay
            heartRate={heartRate}
            isConnected={isConnected}
            elapsedSeconds={elapsedSeconds}
            treadmillData={treadmillData}
            isTreadmillConnected={isTreadmillConnected}
            elevationGain={elevationGain}
            recordedDistanceMeters={recordedDistanceMeters}
            currentSpeed={currentSpeed}
            powerData={powerData}
            isPowerConnected={isPowerConnected}
            locationData={locationData}
            isLocationConnected={isLocationConnected}
          />
          <RecordingControls
            recordingState={recordingState}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
          />
        </main>
        <footer className="App-footer">
          <div className="footer-status">
            {recordingState === RecordingState.Recording && (
              <span className="recording-indicator">● REC</span>
            )}
            {recordingState === RecordingState.Paused && (
              <span className="paused-indicator">❚❚ PAUSED</span>
            )}
          </div>
          <span className="app-version">v{process.env.REACT_APP_VERSION}</span>
        </footer>
        <SaveDialog
          open={dialogOpen}
          trackPointCount={getTrackPoints().length}
          elapsedTime={formatTime(elapsedSeconds)}
          onSave={handleSave}
          onDiscard={handleDiscard}
          stravaAuth={stravaAuth}
          trackPoints={getTrackPoints()}
        />
        <DebugPanel />
      </div>
    </ThemeProvider>
  );
};

export default App;