# Copilot / AI agent instructions for Money Manager

Brief, actionable guidance to help an AI contributor be immediately productive in this repository.

- Project type: Angular 18 application with NgRx, Firebase, PWA support, and optional SSR entrypoints.

Architecture highlights
- Single Angular workspace: main client app under `src/app` with large `AppModule`. Feature modules live under `src/app/modules` (e.g., `splitwise`, `shared`). See [src/app/app.module.ts](src/app/app.module.ts) for composition.
- Global state: NgRx store in `src/app/store` — reducers live in subfolders (`transactions`, `categories`, `accounts`, `budgets`, `goals`, `profile`) and effects under the same folders. Changes that affect data flow must update both reducer and effect. See [src/app/store/index.ts](src/app/store/index.ts).
- Services: business logic lives in `src/app/util/service`. Notable services: `transactions.service.ts`, `common-sync.service.ts` (background sync), `openai.service.ts`, `firebase-messaging.service.ts`, and `ssr.service.ts`.
- Firebase: app uses `@angular/fire` for Auth, Firestore, and Messaging. Config is in `src/environments/environment*.ts`.
- PWA & SW: Service worker configured via `ngsw-config.json` and registered in `AppModule` (see `ServiceWorkerModule.register` in `src/app/app.module.ts`). `public/manifest.json` contains app manifest.
- SSR: Entry points exist (`src/main.server.ts`, `src/app/app.module.server.ts`) but there are no dedicated SSR scripts in `package.json` — treat SSR as optional and inspect these files before changing server-side logic.

Developer workflows & important commands
- Local dev: `npm run start` (runs `ng serve`).
- Production build: `npm run build` (uses `ng build --configuration production`).
- Cache-busted deploy build: `npm run build:cache-bust` or `npm run deploy` (runs `deploy-cache-bust.js` then builds).
- Tests: `npm run test` (dev), `npm run test:ci` (CI: headless Chrome + coverage). There are helper scripts under `scripts/` — e.g. `scripts/run-tests.sh` which runs the CI test flow and prints coverage summary.
- Lint / pre-commit: project uses `husky` (see `prepare` in `package.json`).

Project-specific conventions and patterns
- Centralized declarations: many components are declared in `AppModule` rather than split across many lazy modules — review `app.module.ts` before adding a new global component.
- State changes go through NgRx: UI components dispatch actions, effects handle side-effects and call services in `util/service`, reducers update store slices. To add a new entity, create `actions`, `reducer`, `effects`, and wire them into `src/app/store/index.ts`.
- Firebase offline: Firestore and Auth persistence are enabled using IndexedDB in `AppModule`. When modifying offline behavior, check `provideAuth` and `provideFirestore` initialization blocks.
- Interceptors & security: Security logic is applied via `security.interceptor` registered in `AppModule` (`provideHttpClient(withInterceptors([securityInterceptor]))`). Update here for global HTTP changes.
- PWA UX: PWA components live under `util/components` (back-button, install prompt, nav bar). Service-worker changes require updating `ngsw-config.json` and re-building.

Integration points to watch
- Firebase: config in `src/environments`; many services call Firebase SDKs directly (e.g., `user.service.ts`, `transactions.service.ts`).
- Background sync and notifications: `common-sync.service.ts`, `firebase-messaging.service.ts`, `firebase-messaging-sw.js`.
- External APIs: `openai.service.ts` (OpenAI), `google-sheets.service.ts` (Sheets integration) — inspect their environment-dependent keys and error handling.

How to modify safely (practical tips)
- When changing data flow: update actions → effects → services → reducers, and add unit tests for reducer + effects.
- When touching build/CI: prefer `npm run test:ci` and `scripts/run-tests.sh` to replicate CI behavior.
- For UI changes: prefer adding to `modules/shared` or creating a new feature module to avoid further bloating `AppModule`.

Quick file references (examples)
- App composition: [src/app/app.module.ts](src/app/app.module.ts)
- Global state: [src/app/store/index.ts](src/app/store/index.ts)
- Services: [src/app/util/service](src/app/util/service)
- Environments & Firebase keys: [src/environments/environment.ts](src/environments/environment.ts)
- PWA config: [ngsw-config.json](ngsw-config.json), [public/manifest.json](public/manifest.json)
- Build/test scripts: [package.json](package.json), [scripts/run-tests.sh](scripts/run-tests.sh)

If anything here is unclear or you want me to expand an area (SSR commands, CI pipeline, or typical PR checklist), tell me which part and I'll iterate.
