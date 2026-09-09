import { RecordingState, TrackPoint } from '../domain/models';

export interface PersistedSession {
  version: number;
  recordingState: RecordingState;
  startTimestamp: number;
  lastUpdatedTimestamp: number;
  elapsedSeconds: number;
  elevationGain: number;
  recordedDistanceMeters: number;
  simulatedAltitude: number;
  trackPoints: TrackPoint[];
}

const STORAGE_KEY = 'ftmp_active_recording_session_v1';

export class RecordingPersistenceService {
  private static instance: RecordingPersistenceService | null = null;

  public static getInstance(): RecordingPersistenceService {
    if (!RecordingPersistenceService.instance) {
      RecordingPersistenceService.instance = new RecordingPersistenceService();
    }
    return RecordingPersistenceService.instance;
  }

  public saveSession(session: PersistedSession): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('[RecordingPersistence] Error saving session to localStorage:', e);
    }
  }

  public loadSession(): PersistedSession | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: PersistedSession = JSON.parse(raw);

      // Only restore if the session was active or paused
      if (
        parsed.recordingState !== RecordingState.Recording &&
        parsed.recordingState !== RecordingState.Paused
      ) {
        return null;
      }

      // Restore Date objects for trackPoints
      if (parsed.trackPoints && Array.isArray(parsed.trackPoints)) {
        parsed.trackPoints = parsed.trackPoints.map((tp) => ({
          ...tp,
          timestamp: new Date(tp.timestamp),
        }));
      }

      return parsed;
    } catch (e) {
      console.warn('[RecordingPersistence] Error loading session from localStorage:', e);
      return null;
    }
  }

  public clearSession(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('[RecordingPersistence] Error clearing session:', e);
    }
  }
}

export const recordingPersistenceService = RecordingPersistenceService.getInstance();
