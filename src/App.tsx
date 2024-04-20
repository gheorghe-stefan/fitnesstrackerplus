import React, { useState } from 'react';
import { AppBar, Box, Button, Dialog, Icon, IconButton, ThemeProvider, Toolbar, Tooltip, Typography, createTheme } from '@mui/material';
import './App.css';

const App: React.FC = () => {
  const [isTreadmillConnected, setTreadmillConnection] = useState(false);
  const [isHRConnected, setHRConnection] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <div className="left-container">
          <h1>FitnessTrackerPlus</h1>
        </div>
        <div className="right-container">
          <Tooltip title="Connect a heart rate sensor">
            <IconButton className={isHRConnected ? 'button' : 'button disconnected'} onClick={() => setHRConnection(!isHRConnected)}>
              {isHRConnected ? 'Disconnect HR' : 'Connect HR'}
            </IconButton>
          </Tooltip>
          <Tooltip title="Connect to a treadmill">
            <IconButton className={isTreadmillConnected ? 'button' : 'button disconnected'} onClick={() => setTreadmillConnection(!isTreadmillConnected)}>
              {isTreadmillConnected ? 'Disconnect Treadmill' : 'Connect Treadmill'}
            </IconButton>
          </Tooltip>
        </div>
      </header>
      <footer className="footer">
        <IconButton>Settings</IconButton>
      </footer>
    </div>
  );
}

export default App;