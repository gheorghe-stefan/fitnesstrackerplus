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

// Universally supported 44.1kHz silent MP3 data URI decoded natively by Android & iOS hardware
const SILENT_MP3_DATA_URI =
  'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//8AAABBTEFNRTMuMTAw//uQxAwAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

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
      this.audioUrl = SILENT_MP3_DATA_URI;
      this.audioElement = new Audio(this.audioUrl);
      this.audioElement.loop = true;
      this.audioElement.preload = 'auto';
      // 0.1 volume ensures Android's audio HAL treats this as real audible playback
      this.audioElement.volume = 0.1;
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
      console.warn('[BackgroundKeepAlive] Wake lock request failed:', err);
    }
  }

  private updateMediaSession(recording: boolean): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      if (recording) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'FitnessTracker+',
          artist: 'Workout Recording Active',
          album: 'FitnessTracker+',
          artwork: [
            { src: `${process.env.PUBLIC_URL || ''}/logo192.png`, sizes: '192x192', type: 'image/png' },
            { src: `${process.env.PUBLIC_URL || ''}/logo512.png`, sizes: '512x512', type: 'image/png' },
          ],
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
    this.audioElement = null;
  }
}
