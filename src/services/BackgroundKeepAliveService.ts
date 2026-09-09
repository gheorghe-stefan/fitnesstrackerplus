/**
 * Service to maintain continuous background execution for web fitness tracking.
 *
 * Browsers on mobile (iOS Safari, Android Chrome) suspend JavaScript execution
 * and throttle timers when tabs are placed in the background or the screen locks.
 *
 * By playing a silent audio track in an HTML5 <audio> element, the OS classifies
 * the tab as an active media session (like a music or podcast app), keeping the
 * JS event loop, Web Workers, BLE sensors, and Geolocation active.
 *
 * IMPORTANT: This service is ONLY activated during active recording mode (RecordingState.Recording)
 * and is immediately released on Pause, Stop, Reset, or Unmount.
 */

const FALLBACK_SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

function createSilentAudioUrl(): string {
  if (typeof window === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
    return FALLBACK_SILENT_WAV;
  }

  try {
    const sampleRate = 8000;
    const numChannels = 1;
    const bitsPerSample = 8;
    const durationSec = 1;
    const dataSize = sampleRate * durationSec;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    const bytes = new Uint8Array(buffer, 44, dataSize);
    bytes.fill(128); // 128 is center/silence for 8-bit unsigned PCM

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch {
    return FALLBACK_SILENT_WAV;
  }
}

export class BackgroundKeepAliveService {
  private audioElement: HTMLAudioElement | null = null;
  private wakeLockSentinel: any = null;
  private isAcquired: boolean = false;
  private audioUrl: string | null = null;
  private onVisibilityChangeBound: (() => void) | null = null;

  constructor() {
    this.initAudio();
  }

  private initAudio(): void {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;

    try {
      this.audioUrl = createSilentAudioUrl();
      this.audioElement = new Audio(this.audioUrl);
      this.audioElement.loop = true;
      this.audioElement.preload = 'auto';
      // Low volume just in case, though the WAV itself is 100% digital silence
      this.audioElement.volume = 0.01;
    } catch (e) {
      console.warn('[BackgroundKeepAlive] Could not initialize audio element:', e);
    }
  }

  /**
   * Acquire keep-alive resources. Must ONLY be called when entering RecordingState.Recording.
   */
  public async acquire(): Promise<void> {
    if (this.isAcquired) return;
    this.isAcquired = true;

    // 1. Start silent audio loop
    if (this.audioElement) {
      try {
        await this.audioElement.play();
      } catch (err) {
        console.warn('[BackgroundKeepAlive] Audio autoplay blocked or failed:', err);
      }
    }

    // 2. Request Screen Wake Lock (prevents screen lock while phone is mounted)
    await this.requestWakeLock();

    // 3. Setup visibility listener to re-acquire wake lock if user switches back
    if (typeof document !== 'undefined' && !this.onVisibilityChangeBound) {
      this.onVisibilityChangeBound = () => {
        if (document.visibilityState === 'visible' && this.isAcquired) {
          this.requestWakeLock();
        }
      };
      document.addEventListener('visibilitychange', this.onVisibilityChangeBound);
    }

    // 4. Update MediaSession metadata
    this.updateMediaSession(true);
  }

  /**
   * Release all keep-alive resources. Called on Pause, Stop, Reset, or unmount.
   */
  public release(): void {
    if (!this.isAcquired) return;
    this.isAcquired = false;

    // 1. Pause and reset audio
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {
        console.warn('[BackgroundKeepAlive] Error pausing audio:', e);
      }
    }

    // 2. Release wake lock
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch (e) {
        console.warn('[BackgroundKeepAlive] Error releasing wake lock:', e);
      }
      this.wakeLockSentinel = null;
    }

    // 3. Remove visibility listener
    if (typeof document !== 'undefined' && this.onVisibilityChangeBound) {
      document.removeEventListener('visibilitychange', this.onVisibilityChangeBound);
      this.onVisibilityChangeBound = null;
    }

    // 4. Update MediaSession
    this.updateMediaSession(false);
  }

  public get isActive(): boolean {
    return this.isAcquired;
  }

  private async requestWakeLock(): Promise<void> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    try {
      this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      this.wakeLockSentinel.addEventListener('release', () => {
        this.wakeLockSentinel = null;
      });
    } catch (err) {
      // Wake lock can fail if battery is critically low or system disallows it
      console.warn('[BackgroundKeepAlive] Wake lock request failed:', err);
    }
  }

  private updateMediaSession(recording: boolean): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      if (recording) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Fitness Tracker',
          artist: 'Recording Workout',
          album: 'FitnessTracker+',
        });
        navigator.mediaSession.playbackState = 'playing';
      } else {
        navigator.mediaSession.playbackState = 'paused';
      }
    } catch {
      // Ignore media session errors
    }
  }

  public destroy(): void {
    this.release();
    if (this.audioUrl && typeof URL !== 'undefined' && URL.revokeObjectURL && !this.audioUrl.startsWith('data:')) {
      try {
        URL.revokeObjectURL(this.audioUrl);
      } catch {
        // Ignore
      }
    }
    this.audioElement = null;
  }
}
