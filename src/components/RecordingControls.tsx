import React from 'react';
import { Button } from '@mui/material';
import { PlayArrow, Pause, Stop } from '@mui/icons-material';
import { RecordingState } from '../domain/models';

export interface RecordingControlsProps {
  recordingState: RecordingState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

/**
 * Recording control buttons that adapt to the current recording state.
 * Idle: Start | Recording: Pause + Stop | Paused: Resume + Stop
 */
export const RecordingControls: React.FC<RecordingControlsProps> = ({
  recordingState,
  onStart,
  onPause,
  onResume,
  onStop,
}) => {
  const isIdle = recordingState === RecordingState.Idle;
  const isRecording = recordingState === RecordingState.Recording;
  const isPaused = recordingState === RecordingState.Paused;

  return (
    <div className="recording-controls">
      {isIdle && (
        <Button
          className="control-btn start-btn"
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={onStart}
          id="btn-start"
        >
          Start
        </Button>
      )}
      {isRecording && (
        <Button
          className="control-btn pause-btn"
          variant="contained"
          startIcon={<Pause />}
          onClick={onPause}
          id="btn-pause"
        >
          Pause
        </Button>
      )}
      {isPaused && (
        <Button
          className="control-btn resume-btn"
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={onResume}
          id="btn-resume"
        >
          Resume
        </Button>
      )}
      {(isRecording || isPaused) && (
        <Button
          className="control-btn stop-btn"
          variant="outlined"
          startIcon={<Stop />}
          onClick={onStop}
          id="btn-stop"
        >
          Stop
        </Button>
      )}
    </div>
  );
};
