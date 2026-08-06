import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { saveAs } from 'file-saver';
import { useHeartRateSensor } from './hooks/useHeartRateSensor';
import { useTreadmillSensor } from './hooks/useTreadmillSensor';
import { useRecorder } from './hooks/useRecorder';
import { Header } from './components/Header';
import { DataDisplay } from './components/DataDisplay';
import { RecordingControls } from './components/RecordingControls';
import { SaveDialog } from './components/SaveDialog';
import { GpxExporter } from './services/GpxExporter';
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

const gpxExporter = new GpxExporter();

/**
 * Root application shell — thin composition layer.
 * Wires hooks (sensors, recorder) to presentational components.
 * All business logic lives in hooks and services.
 */
const App: React.FC = () => {
  const { sensorName, heartRate, isConnected, connect, disconnect } = useHeartRateSensor();
  const {
    treadmillName,
    treadmillData,
    isTreadmillConnected,
    connectTreadmill,
    disconnectTreadmill,
  } = useTreadmillSensor();

  const {
    recordingState, elapsedSeconds,
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

    setSensorData({
      hr: effectiveHr,
      speed: isTreadmillConnected ? treadmillData.speed : undefined,
      inclination: isTreadmillConnected ? treadmillData.inclination : undefined,
    });
  }, [heartRate, isConnected, treadmillData, isTreadmillConnected, setSensorData]);

  const handleStart = () => start();
  const handlePause = () => pause();
  const handleResume = () => resume();

  const handleStop = () => {
    stop();
    setDialogOpen(true);
  };

  const handleSave = () => {
    const points = getTrackPoints();
    const gpx = gpxExporter.export(points);
    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const filename = `activity_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.gpx`;
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
          treadmillName={treadmillName}
          onConnectTreadmill={connectTreadmill}
          onDisconnectTreadmill={disconnectTreadmill}
        />
        <main className="App-content">
          <DataDisplay
            heartRate={heartRate}
            isConnected={isConnected}
            elapsedSeconds={elapsedSeconds}
            treadmillData={treadmillData}
            isTreadmillConnected={isTreadmillConnected}
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
        />
      </div>
    </ThemeProvider>
  );
};

export default App;