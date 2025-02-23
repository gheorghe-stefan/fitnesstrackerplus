import React, { useState } from 'react';
import { SensorManager } from './sensors/SensorManager';
import { AppBar, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Icon, IconButton, ThemeProvider, Toolbar, Tooltip, Typography, createTheme } from '@mui/material';
import './App.css';
import { HeartBroken } from '@mui/icons-material';
import { saveAs } from 'file-saver';

class AppState
{
  heartRateSensorName: string | null = null;
  heartRate: number = 0;
  isTreadmillConnected: boolean = false;
  isHRConnected: boolean = false;
  isRecording: boolean = false;
  timer: number = 0;
  hrData: number[] = [];
  isDialogOpen: boolean = false; 
}

class App extends React.Component<any, AppState>
{
  SensorManager : SensorManager = new SensorManager();
  private intervalId: NodeJS.Timeout | null = null;

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
        heartRate: 0
      });
  }

  private handleStartPause = () => {
    this.setState((prevState) => {
      if (prevState.isRecording) {
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
      } else {
        this.intervalId = setInterval(() => {
          this.setState((prevState) => ({
            timer: prevState.timer + 1,
            hrData: [...prevState.hrData, prevState.heartRate],
          }));
        }, 1000);
      }
      return { isRecording: !prevState.isRecording };
    });
  };
  
  private handleStop = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.setState({ isRecording: false, timer: 0 });
    this.saveDataToFile(this.state.hrData);
    this.setState({ hrData: [] });
  };
  
  private saveDataToFile = (data: number[]) => {
    const blob = new Blob([data.join('\n')], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'hr_data.txt');
  };
  
  private formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  private handleDialogOpen = () => {
    this.setState({ isDialogOpen: true });
  };

  private handleDialogClose = () => {
    this.setState({ isDialogOpen: false });
  };

  private handleDialogConfirm = () => {
    this.handleStop();
    this.setState({ isDialogOpen: false });
  };

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
            <section>
              <table className="App-content-table">
                <tbody>
                  <tr>
                    <td className="big-font">{this.state.heartRate} bpm</td>
                    <td className="big-font">{this.state.heartRate / 2}</td>
                  </tr>
                </tbody>
              </table>
            </section>
            <div className="timer">
                <h2>{this.formatTime(this.state.timer)}</h2>
                <Button onClick={this.handleStartPause}>{this.state.isRecording ? 'Pause' : 'Start'}</Button>
                <Button onClick={this.handleDialogOpen}>Stop</Button>
              </div>
          </div>

          <div className="App-footer">
          <footer className="App-footer-group">
            <IconButton>Settings</IconButton>
          </footer>
          </div>
        </div>

        <Dialog
            open={this.state.isDialogOpen}
            onClose={this.handleDialogClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">{"Stop Recording?"}</DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                Are you sure you want to stop the recording and save the data?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleDialogClose} color="primary">
                No
              </Button>
              <Button onClick={this.handleDialogConfirm} color="primary" autoFocus>
                Yes
              </Button>
            </DialogActions>
          </Dialog>
      </ThemeProvider>
    );
  }
}

export default App;