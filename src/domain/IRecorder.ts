import { TrackPoint, RecordingState } from './models';

/**
 * Activity recorder interface managing the recording lifecycle.
 * Follows the state machine: Idle → Recording ⇄ Paused → Stopped.
 * Data points are only accepted in the Recording state.
 */
export interface IRecorder {
  readonly state: RecordingState;
  readonly trackPoints: ReadonlyArray<TrackPoint>;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  addDataPoint(data: Omit<TrackPoint, 'timestamp'>): void;
  reset(): void;
}
