/**
 * Represents a single recorded data point during an activity.
 * Fields are optional to support different sensor combinations
 * (HR only, treadmill, GPS watch, etc.).
 */
export interface TrackPoint {
  readonly timestamp: Date;
  readonly hr?: number;
  readonly speed?: number;
  readonly inclination?: number;
  readonly lat?: number;
  readonly lon?: number;
  readonly ele?: number;
}

/**
 * State machine states for activity recording.
 * Transitions: Idle → Recording ⇄ Paused → Stopped → (reset) → Idle
 */
export enum RecordingState {
  Idle = 'idle',
  Recording = 'recording',
  Paused = 'paused',
  Stopped = 'stopped',
}
