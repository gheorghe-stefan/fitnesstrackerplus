import { BackgroundKeepAliveService } from '../services/BackgroundKeepAliveService';

describe('BackgroundKeepAliveService', () => {
  let service: BackgroundKeepAliveService;
  let playMock: jest.SpyInstance;
  let pauseMock: jest.SpyInstance;

  beforeAll(() => {
    // JSDOM does not implement play/pause, mock them to prevent virtual console logs
    playMock = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    pauseMock = jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  afterAll(() => {
    playMock.mockRestore();
    pauseMock.mockRestore();
  });

  beforeEach(() => {
    service = new BackgroundKeepAliveService();
  });

  afterEach(() => {
    service.destroy();
  });

  it('should initialize in an inactive state', () => {
    expect(service.isActive).toBe(false);
  });

  it('should become active on acquire and play audio', async () => {
    await service.acquire();
    expect(service.isActive).toBe(true);
    expect(playMock).toHaveBeenCalled();
  });

  it('should become inactive on release and pause audio', async () => {
    await service.acquire();
    expect(service.isActive).toBe(true);

    service.release();
    expect(service.isActive).toBe(false);
    expect(pauseMock).toHaveBeenCalled();
  });

  it('should handle repeated acquire/release gracefully', async () => {
    await service.acquire();
    await service.acquire();
    expect(service.isActive).toBe(true);

    service.release();
    service.release();
    expect(service.isActive).toBe(false);
  });

  it('should clean up on destroy', async () => {
    await service.acquire();
    service.destroy();
    expect(service.isActive).toBe(false);
  });
});
