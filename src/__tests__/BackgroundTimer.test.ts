import { BackgroundTimer } from '../services/BackgroundTimer';

describe('BackgroundTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize not running', () => {
    const timer = new BackgroundTimer();
    expect(timer.isRunning).toBe(false);
    timer.destroy();
  });

  it('should start and report isRunning = true', () => {
    const timer = new BackgroundTimer();
    const tickMock = jest.fn();
    timer.start(tickMock);
    expect(timer.isRunning).toBe(true);
    timer.destroy();
  });

  it('should stop and report isRunning = false', () => {
    const timer = new BackgroundTimer();
    const tickMock = jest.fn();
    timer.start(tickMock);
    expect(timer.isRunning).toBe(true);

    timer.stop();
    expect(timer.isRunning).toBe(false);
    timer.destroy();
  });

  it('should trigger tick callbacks on interval in fallback mode', () => {
    const timer = new BackgroundTimer();
    const tickMock = jest.fn();
    timer.start(tickMock);

    // Advance 3 seconds
    jest.advanceTimersByTime(3000);
    expect(tickMock).toHaveBeenCalledTimes(3);

    timer.stop();
    jest.advanceTimersByTime(3000);
    // Should not have received any more ticks after stop
    expect(tickMock).toHaveBeenCalledTimes(3);

    timer.destroy();
  });
});
