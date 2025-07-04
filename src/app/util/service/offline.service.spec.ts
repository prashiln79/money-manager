import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { OfflineService } from './offline.service';

describe('OfflineService', () => {
  let service: OfflineService;
  let mockSwUpdate: jasmine.SpyObj<SwUpdate>;

  beforeEach(() => {
    const swUpdateSpy = jasmine.createSpyObj('SwUpdate', ['isEnabled', 'checkForUpdate', 'activateUpdate'], {
      versionUpdates: { subscribe: () => {} }
    });

    TestBed.configureTestingModule({
      providers: [
        OfflineService,
        { provide: SwUpdate, useValue: swUpdateSpy }
      ]
    });

    service = TestBed.inject(OfflineService);
    mockSwUpdate = TestBed.inject(SwUpdate) as jasmine.SpyObj<SwUpdate>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with current online status', () => {
    const status = service.getCurrentNetworkStatus();
    expect(status.online).toBe(navigator.onLine);
  });

  it('should detect online status correctly', () => {
    const isOnline = service.isCurrentlyOnline();
    expect(isOnline).toBe(navigator.onLine);
  });

  it('should get connection quality', () => {
    const quality = service.getConnectionQuality();
    expect(['offline', 'excellent', 'good', 'poor', 'unknown']).toContain(quality);
  });

  it('should handle notification permission request', async () => {
    const permission = await service.requestNotificationPermission();
    expect(['granted', 'denied', 'default']).toContain(permission);
  });

  it('should cache and retrieve data', async () => {
    const testData = { test: 'data' };
    const testKey = 'test-key';

    // Cache data
    await service.cacheData(testKey, testData);

    // Retrieve data
    const retrievedData = await service.getCachedData(testKey);
    expect(retrievedData).toEqual(testData);
  });

  it('should clear cache', async () => {
    await expectAsync(service.clearCache()).toBeResolved();
  });
}); 