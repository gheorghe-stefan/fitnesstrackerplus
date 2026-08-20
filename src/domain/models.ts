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
  readonly ele?: number;
  readonly cadence?: number;
  readonly power?: number;
  readonly lat?: number;
  readonly lng?: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number;
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
