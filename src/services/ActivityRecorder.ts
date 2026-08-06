import { IRecorder } from '../domain/IRecorder';
import { TrackPoint, RecordingState } from '../domain/models';

/**
 * Manages the recording lifecycle and stores track points.
 * Pure data service — no timers, no UI concerns.
 * Timer management is the responsibility of the consuming hook/component.
 */
export class ActivityRecorder implements IRecorder {
  private _state: RecordingState = RecordingState.Idle;
  private _trackPoints: TrackPoint[] = [];

  get state(): RecordingState {
    return this._state;
  }

  get trackPoints(): ReadonlyArray<TrackPoint> {
    return this._trackPoints;
  }

  start(): void {
    if (this._state !== RecordingState.Idle) return;
    this._state = RecordingState.Recording;
    this._trackPoints = [];
  }

  pause(): void {
    if (this._state !== RecordingState.Recording) return;
    this._state = RecordingState.Paused;
  }

  resume(): void {
    if (this._state !== RecordingState.Paused) return;
    this._state = RecordingState.Recording;
  }

  stop(): void {
    if (this._state !== RecordingState.Recording && this._state !== RecordingState.Paused) return;
    this._state = RecordingState.Stopped;
  }

  addDataPoint(data: Omit<TrackPoint, 'timestamp'>): void {
    if (this._state !== RecordingState.Recording) return;
    this._trackPoints.push({
      ...data,
      timestamp: new Date(),
    });
  }

  reset(): void {
    this._state = RecordingState.Idle;
    this._trackPoints = [];
  }
}
