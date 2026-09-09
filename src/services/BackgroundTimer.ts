/**
 * Precision 1-second interval timer designed for background execution.
 *
 * Uses a dedicated Web Worker running on a background thread so interval ticks
 * are not subject to main-thread background throttling when the tab is hidden.
 * Falls back gracefully to window.setInterval in environments where Web Workers
 * are not available (e.g. unit test runners).
 */

export interface IBackgroundTimer {
  start: (onTick: () => void) => void;
  stop: () => void;
  destroy: () => void;
  readonly isRunning: boolean;
}

const WORKER_SCRIPT = `
  let intervalId = null;
  self.onmessage = function(e) {
    if (e.data === 'start') {
      if (intervalId !== null) clearInterval(intervalId);
      intervalId = setInterval(function() {
        self.postMessage('tick');
      }, 1000);
    } else if (e.data === 'stop') {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  };
`;

export class BackgroundTimer implements IBackgroundTimer {
  private worker: Worker | null = null;
  private fallbackInterval: ReturnType<typeof setInterval> | null = null;
  private workerBlobUrl: string | null = null;
  private onTickCallback: (() => void) | null = null;
  private _isRunning: boolean = false;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof window === 'undefined' || typeof Worker === 'undefined' || typeof Blob === 'undefined' || !URL.createObjectURL) {
      return;
    }

    try {
      const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
      this.workerBlobUrl = URL.createObjectURL(blob);
      this.worker = new Worker(this.workerBlobUrl);
      this.worker.onmessage = (e: MessageEvent) => {
        if (e.data === 'tick' && this.onTickCallback && this._isRunning) {
          this.onTickCallback();
        }
      };
      this.worker.onerror = (err) => {
        console.warn('[BackgroundTimer] Worker error, switching to fallback:', err);
        this.destroyWorker();
      };
    } catch (e) {
      console.warn('[BackgroundTimer] Web Worker initialization failed, using setInterval fallback:', e);
      this.destroyWorker();
    }
  }

  public start(onTick: () => void): void {
    this.stop();
    this._isRunning = true;
    this.onTickCallback = onTick;

    if (this.worker) {
      this.worker.postMessage('start');
    } else {
      this.fallbackInterval = setInterval(() => {
        if (this.onTickCallback && this._isRunning) {
          this.onTickCallback();
        }
      }, 1000);
    }
  }

  public stop(): void {
    this._isRunning = false;
    this.onTickCallback = null;

    if (this.worker) {
      this.worker.postMessage('stop');
    }

    if (this.fallbackInterval !== null) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
  }

  public get isRunning(): boolean {
    return this._isRunning;
  }

  private destroyWorker(): void {
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {
        // Ignore
      }
      this.worker = null;
    }
    if (this.workerBlobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
      try {
        URL.revokeObjectURL(this.workerBlobUrl);
      } catch {
        // Ignore
      }
      this.workerBlobUrl = null;
    }
  }

  public destroy(): void {
    this.stop();
    this.destroyWorker();
  }
}
