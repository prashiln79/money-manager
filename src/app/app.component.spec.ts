import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppComponent } from './app.component';
import { ThemeSwitchingService } from './util/service/theme-switching.service';
import { Location } from '@angular/common';
import { LoaderService } from './util/service/loader.service';
import { PwaNavigationService } from './util/service/pwa-navigation.service';
import { CommonSyncService } from './util/service/common-sync.service';
import { SsrService } from './util/service/ssr.service';
import { FirebaseMessagingService } from './util/service/firebase-messaging.service';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let mockThemeSwitchingService: jasmine.SpyObj<ThemeSwitchingService>;
  let mockLocation: jasmine.SpyObj<Location>;
  let mockLoaderService: jasmine.SpyObj<LoaderService>;
  let mockPwaNavigationService: jasmine.SpyObj<PwaNavigationService>;
  let mockCommonSyncService: jasmine.SpyObj<CommonSyncService>;
  let mockSsrService: jasmine.SpyObj<SsrService>;
  let mockFirebaseMessagingService: jasmine.SpyObj<FirebaseMessagingService>;

  beforeEach(async () => {
    const themeSpy = jasmine.createSpyObj('ThemeSwitchingService', ['initTheme']);
    const locationSpy = jasmine.createSpyObj('Location', ['back', 'forward']);
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show', 'hide']);
    const pwaSpy = jasmine.createSpyObj('PwaNavigationService', ['destroy', 'goBack', 'goForward'], {
      navigationState$: of({
        canGoBack: false,
        currentRoute: '',
        previousRoute: '',
        navigationStack: [],
        isStandalone: false,
        isMobile: false
      })
    });
    const syncSpy = jasmine.createSpyObj('CommonSyncService', [], {
      isOnline$: of(true)
    });
    const ssrSpy = jasmine.createSpyObj('SsrService', ['isClientSide']);
    const firebaseSpy = jasmine.createSpyObj('FirebaseMessagingService', ['listenForMessages']);

    // Setup SSR service to return false for client-side checks
    ssrSpy.isClientSide.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([])
      ],
      declarations: [
        AppComponent
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ThemeSwitchingService, useValue: themeSpy },
        { provide: Location, useValue: locationSpy },
        { provide: LoaderService, useValue: loaderSpy },
        { provide: PwaNavigationService, useValue: pwaSpy },
        { provide: CommonSyncService, useValue: syncSpy },
        { provide: SsrService, useValue: ssrSpy },
        { provide: FirebaseMessagingService, useValue: firebaseSpy }
      ]
    }).compileComponents();

    mockThemeSwitchingService = TestBed.inject(ThemeSwitchingService) as jasmine.SpyObj<ThemeSwitchingService>;
    mockLocation = TestBed.inject(Location) as jasmine.SpyObj<Location>;
    mockLoaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    mockPwaNavigationService = TestBed.inject(PwaNavigationService) as jasmine.SpyObj<PwaNavigationService>;
    mockCommonSyncService = TestBed.inject(CommonSyncService) as jasmine.SpyObj<CommonSyncService>;
    mockSsrService = TestBed.inject(SsrService) as jasmine.SpyObj<SsrService>;
    mockFirebaseMessagingService = TestBed.inject(FirebaseMessagingService) as jasmine.SpyObj<FirebaseMessagingService>;
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Money Manager'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Money Manager');
  });

  it('should initialize PWA features', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    app.ngOnInit();
    
    expect(mockFirebaseMessagingService.listenForMessages).toHaveBeenCalled();
  });

  it('should handle navigation methods', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    app.goBack();
    expect(mockPwaNavigationService.goBack).toHaveBeenCalled();
    
    app.goForward();
    expect(mockPwaNavigationService.goForward).toHaveBeenCalled();
  });

  it('should cleanup on destroy', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    app.ngOnDestroy();
    
    expect(mockPwaNavigationService.destroy).toHaveBeenCalled();
  });
});
