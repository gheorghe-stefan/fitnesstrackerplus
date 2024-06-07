import React, { useState } from 'react';
import { SensorManager } from './sensors/SensorManager';
import { AppBar, Box, Button, Dialog, Icon, IconButton, ThemeProvider, Toolbar, Tooltip, Typography, createTheme } from '@mui/material';
import './App.css';
import { HeartBroken } from '@mui/icons-material';

class AppState
{
  heartRateSensorName: string | null = null;
  heartRate: number | null = null;
  isTreadmillConnected: boolean = false;
  isHRConnected: boolean = false;
}

class App extends React.Component<any, AppState>
{
  SensorManager : SensorManager = new SensorManager();

  constructor(props: any)
  {
    super(props);
    this.state = new AppState();
    (window as any).setAppState = ((stateObject: any) => this.setState(stateObject));
  }

  async onSearchHRSensor()
  {
    var sensor = await this.SensorManager.SearchHRSensor();
    this.setState({heartRateSensorName : sensor.name});
    sensor.onDisconnected = this.clearHRData.bind(this);
    await sensor.start(this.onHRDataReceived.bind(this));
  };

  disconnectHRSensor()
  {
    this.SensorManager.HRSensor?.disconnect();
    this.clearHRData();
  }

  private onHRDataReceived(hr: number): void 
  {
    //this.Recorder.Values.HR = hr;
    this.setState({heartRate: hr})
  }
  
  private clearHRData() {
    //this.Recorder.Values.HR = null;
    this.setState(
      {
        heartRateSensorName: null,
        heartRate: null
      });
  }

  setHRConnection(arg0: boolean): void
  {
    this.setState({ isHRConnected: arg0 });
  }

  setTreadmillConnection(arg0: boolean): void
  {
    this.setState({ isTreadmillConnected: arg0 });
  }

  private static readonly darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#91a47d',
      },
    },
    components: {
        MuiTextField: {
            styleOverrides: {
                root: {
                    width: '7ch',
                    margin: '1rem',
                    fontSize: '2rem',
                },

            }
        },
    }
  });

  render()
  {  
    return (
      <ThemeProvider theme={App.darkTheme}>
        <div className="App">
          <header className="App-header">
            <div className="left-container">
              <h1>FitnessTrackerPlus</h1>
            </div>
            <div className="right-container">
            {this.state.heartRateSensorName == null ?
                <Tooltip title="Connect a heart rate sensor">
                  <IconButton className='button disconnected' sx={{marginRight: "0.5rem"}} onClick={this.onSearchHRSensor.bind(this)}>
                    <HeartBroken sx={{transform: 'scale(1.2)'}} />
                  </IconButton>
                </Tooltip> :
                <Tooltip title="Disconnect the heart rate sensor">
                  <IconButton className='button' sx={{marginRight: "0.5rem"}} onClick={this.disconnectHRSensor.bind(this)}>
                    <HeartBroken sx={{transform: 'scale(1.2)'}} />
                  </IconButton>
                </Tooltip>
              }
            </div>
          </header>

          <div className="App-content">
            {/* Main content */}
          </div>

          <div className="App-footer">
          <footer className="App-footer-group">
            <IconButton>Settings</IconButton>
          </footer>
          </div>
        </div>
      </ThemeProvider>
    );
  }
}

export default App;