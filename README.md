<p align="center">
  <img src="src/assets/images/banner.png" alt="MoneyManager Banner" width="100%">
</p>

<p align="center">
  <a href="https://prashiln79.github.io/money-manager" target="_blank"
     style="background:#4f46e5; color:white; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:600; display:inline-block; margin: 4px;">
     🚀 Go to Web App
  </a>
  &nbsp;&nbsp;
  <a href="https://play.google.com/store/apps/details?id=io.github.prashiln79.twa" target="_blank"
     style="background:#059669; color:white; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:600; display:inline-block; margin: 4px;">
     📱 Get on Google Play
  </a>
</p>

<p align="center">
  <a href="https://play.google.com/store/apps/details?id=io.github.prashiln79.twa" target="_blank">
    <img src="https://img.shields.io/badge/Google_Play-414141?style=flat&logo=googleplay&logoColor=white" alt="Google Play" />
  </a>
  <img src="https://img.shields.io/badge/Angular-21-red" alt="Angular 21" />
  <img src="https://img.shields.io/badge/PWA-Ready-green" alt="PWA Ready" />
  <img src="https://img.shields.io/badge/SEO-Optimized-blue" alt="SEO Optimized" />
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License" />
</p>

# MoneyManager

## 1. Overview

MoneyManager is a cross-platform financial management suite designed to help individuals and families manage their finances from desktop and mobile devices. Built as a Progressive Web App (PWA), it provides a unified experience for tracking income, expenses, budgets, accounts, and other supported financial activities.

Whether managing personal accounts, coordinating household budgets with family members, planning annual goals, or calculating tax liabilities, MoneyManager offers a local-first, offline-capable experience backed by real-time cloud synchronization, AI-powered conversational data entry, and advanced financial analytics.

---

## 2. Key Features

*(Verified and fully implemented in the current codebase)*

### 💳 Personal & Account Management
- **Multi-Account Tracking**: Real-time management of bank accounts, cash wallets, credit cards, and loan/investment accounts with aggregate net worth calculation.
- **Account Reconciliation & Transfers**: Seamless internal transfers between accounts with real-time balance recalculation.
- **Goal Tracking**: Create target-based savings goals with target dates, visual progress metrics, and deposit tracking.
- **Loan & EMI Calculator**: Built-in amortisation and EMI calculator for loan planning.

### 📝 Income & Expense Tracking
- **Complete CRUD Operations**: Create, view, edit, and delete transactions with instant state updates via NgRx entity management.
- **Granular Classification**: Categorize transactions with custom color-coded categories, subcategories, custom payment methods, tags, and attachments/notes.
- **Transaction History & Multi-Criteria Filtering**: Filter transaction records by custom date ranges, accounts, categories, transaction types, or keyword search.

### 👨‍👩‍👧‍👦 Family & Group Finance Management
- **Collaborative Family Workspaces**: Create or join family groups using unique invite codes (e.g., `FAM-XXXX`).
- **Member Roles & Permissions**: Role-based access control distinguishing between `admin` and `member`.
- **Shared Expenses & Group Transactions**: Record group transactions with multi-payer attribution (`paidBy`) and proportional member splits (`splitBetween`).
- **Settle-Up & Debt Simplification**: Automated calculation of member balances and pairwise debt netting with support for settlement logs via Cash, UPI, or Bank Transfer.

### 🎯 Budget Planning
- **Monthly Category Budgets**: Set spending limits per category with visual threshold warnings and progress bars.
- **Yearly Budget Planning**: 6-step guided annual planning wizard covering income projections, debt reduction plans, savings milestones, and monthly category allocations.

### 📊 Reports & Financial Analytics
- **Multi-Period Visualizations**: Spending reports rendered with Apache ECharts and AmCharts across weekly, monthly, yearly, and all-time periods.
- **Cash Flow Analysis**: Income vs. expense trajectories, top spending categories, and member contribution breakdowns for families.

### ⚖️ Tax Management (India FY 2025-26)
- **Regime Comparison**: Side-by-side comparison between the New Regime (Section 115BAC) and the Old Regime.
- **Tax Liability Breakdown**: Automatic calculation of Standard Deduction, Section 87A rebate, tiered surcharges with marginal relief, and 4% Health & Education Cess.
- **GST Calculator & Text Reports**: Calculate CGST/SGST breakdowns and generate exportable tax summary reports.

### 💾 Data Portability, Import & Export
- **CSV & JSON Import**: Drag-and-drop file import wizard with custom field mapping, category matching, and duplicate transaction detection.
- **Data Export & Full Backup**: Download transactions in CSV or JSON, create full application backups, and restore snapshots.
- **Google Sheets Sync**: Direct bi-directional integration with Google Sheets API.

### 🤖 AI Financial Assistant & Voice Input
- **Natural Language Parsing**: Record transactions conversationally via OpenAI GPT-4o and Google Gemini APIs.
- **Voice Commands**: Integrated voice recording and transcription using OpenAI Whisper.
- **Conversational Queries**: Query past spending habits and receive conversational summaries.

---

## 3. Feature Implementation Status

The following audit matrix reflects the current state of the codebase:

| Feature | Status | Notes / Limitations |
|---|---|---|
| **Personal finance management** | ✅ Implemented | Full support for personal ledgers, account balances, categorization, and savings goals. |
| **Family and group finance management** | ✅ Implemented | Dedicated `FamilyModule` with group workspaces, invite codes, role permissions, and aggregated group feeds. |
| **Income and expense tracking** | ✅ Implemented | Core ledger engine supporting income, expense, and transfer transaction types. |
| **Transaction creation, editing, and deletion** | ✅ Implemented | Full CRUD with optimistic UI updates, NgRx state management, and confirmation dialogs. |
| **Expense categories** | ✅ Implemented | Custom category management with color pickers, Material icons, and budget limits. |
| **Budget planning and tracking** | ✅ Implemented | Real-time category budget tracking with visual progress indicators and threshold alerts. |
| **Account management** | ✅ Implemented | Multiple account types (Bank, Cash, Credit Card, Investment, Loan) with automatic net worth aggregation. |
| **Transaction history and filtering** | ✅ Implemented | Full text search, date range pickers, category/account filters, and transaction sorting via `FilterService`. |
| **Financial summaries, charts, and reports** | ✅ Implemented | Comprehensive charts powered by ECharts and AmCharts across weekly, monthly, and yearly scopes. |
| **Shared expenses and group transactions** | ✅ Implemented | Multi-payer entry (`PaidByMember`) and custom share splits (`SplitBetweenMember`). |
| **Offline guest mode** | ✅ Implemented | Instant local-first access with IndexedDB (`offline-guest` scope) without requiring login. Seamless transition to authenticated accounts. |
| **Offline data access and synchronization** | ✅ Implemented | Service worker precaches app assets; `CommonSyncService` queues mutations in IndexedDB and flushes to Firestore upon reconnection. |
| **Push notifications** | ✅ Implemented | Firebase Cloud Messaging (FCM) integration with service worker (`firebase-messaging-sw.js`), token management, and platform permission handling. |
| **Data import and export** | ✅ Implemented | CSV/JSON export, full database backup/restore, CSV transaction import with duplicate detection, and Google Sheets sync. |
| **Tax management** | ✅ Implemented | Indian Income Tax calculator (`TaxService`, `TaxComponent`) for FY 2025-26 (Old vs. New Regime, Surcharge, Cess, GST). |
| **Split expense management** | ✅ Implemented | Settle-up dashboard (`SettleUpComponent`), pairwise debt netting, and settlement tracking with linked payment records. |
| **Yearly budget planning** | ✅ Implemented | 6-step guided wizard in `BudgetsComponent` for annual income allocation, debt payoff, and savings goals. |
| **Automatic or recurring transactions** | ⚠️ Partially Implemented | Recurring transaction templates, recurrence frequencies, next occurrence dates, and due/upcoming tracking are implemented. Fully automated backend execution (cron/cloud triggers without manual review) is planned. |
| **Authentication and cloud data synchronization** | ✅ Implemented | Firebase Authentication (Google, Email/Password, Anonymous) with real-time Cloud Firestore synchronization. |

---

## 4. PWA and Cross-Platform Support

MoneyManager is engineered from the ground up as an installable, responsive Progressive Web App complying with modern PWA specifications:

### Supported Platforms & Browsers
- **Desktop (Windows, macOS, Linux)**: Modern Chromium-based browsers (Chrome, Edge, Brave), Safari, and Firefox. Includes full support for desktop layout with sidebar navigation, keyboard shortcuts, and Window Controls Overlay (`window-controls-overlay`).
- **Mobile (Android & iOS)**:
  - **Android**: Installable directly from Chrome/Edge as an APK-grade PWA or downloadable via the Google Play Store through its Trusted Web Activity (TWA).
  - **iOS / iPadOS**: Installable to the home screen via Safari ("Add to Home Screen"), supporting standalone full-screen view and safe-area insets.
- **Tablets**: Responsive layouts dynamically adapting navigation between desktop sidebar and mobile interface based on responsive breakpoints.

### PWA Capabilities & Configuration
- **Web App Manifest (`public/manifest.json`)**: Configured with `standalone` display mode, `window-controls-overlay`, custom launch handlers, protocol handlers (`web+money`, `web+transaction`, `web+budget`), file handlers (`.csv`, `.xls`, `.xlsx`, `.pdf`), and dynamic shortcuts ("Add Transaction").
- **Service Worker (`@angular/service-worker`)**: Configured via `ngsw-config.json` with aggressive prefetching for core bundles, lazy caching for assets/fonts/i18n, and performance caching strategies for API and static CDN endpoints.
- **Offline Data Handling & Limitations**:
  - **Available Offline**: Complete reading and editing of personal and cached family transactions, category creation, account modifications, budgets, and local tax calculations.
  - **Sync on Reconnection**: All pending offline mutations recorded in IndexedDB are queued by `CommonSyncService` and synced automatically to Cloud Firestore in batches when network connectivity is restored.
  - **Offline Limitations**: AI Assistant natural language parsing and voice transcription require an active internet connection to contact OpenAI/Gemini endpoints. Initial family group invitation lookups and external Google Sheets synchronization require online access.
- **Google Play Availability**: Distributed as an Android application powered by Google Play's Trusted Web Activity (TWA) framework under package ID `io.github.prashiln79.twa`.

---

## 5. Installation Guide

### End Users

#### Web & Desktop PWA
1. Open [https://prashiln79.github.io/money-manager](https://prashiln79.github.io/money-manager) in any modern browser.
2. Click the **Install** icon in the browser address bar (Chrome, Edge, Brave) or select **Install MoneyManager** from the browser menu.
3. On macOS Safari, choose **File > Add to Dock**.

#### Android (Google Play Store)
- Install directly from the [Google Play Store](https://play.google.com/store/apps/details?id=io.github.prashiln79.twa).

#### iOS / iPadOS
1. Navigate to the web app in Safari.
2. Tap the **Share** button in the Safari toolbar.
3. Scroll down and tap **Add to Home Screen**.

---

## 6. Screenshots and Demo

<table width="100%">
  <thead>
    <tr>
      <th align="center" width="33%">📊 Dashboard Overview</th>
      <th align="center" width="33%">💰 Budget & Categories</th>
      <th align="center" width="33%">📈 Reports & Analytics</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center">
        <img src="src/assets/images/screenshot/img1.png" alt="Dashboard Overview" width="100%">
      </td>
      <td align="center">
        <img src="src/assets/images/screenshot/img2.png" alt="Budget & Categories" width="100%">
      </td>
      <td align="center">
        <img src="src/assets/images/screenshot/img3.png" alt="Reports & Analytics" width="100%">
      </td>
    </tr>
  </tbody>
</table>

---

## 7. Technology Stack

| Category | Technologies | Description |
|---|---|---|
| **Core Framework** | Angular 21, TypeScript 5.x | Standalone components, signals, reactive forms, SSR prerendering |
| **State Management** | NgRx 21 | `@ngrx/store`, `@ngrx/effects`, `@ngrx/entity`, DevTools |
| **UI & Theming** | Angular Material, Tailwind CSS, SCSS | Dynamic light and dark theme palette tokens, responsive layouts |
| **Backend & Cloud** | Firebase | Cloud Firestore, Firebase Authentication, Cloud Messaging (FCM), Firebase Analytics |
| **Local Storage & Sync** | IndexedDB (`LocalIndexDBStorageService`), Service Worker | Local-first architecture, offline mutation queues, background sync |
| **AI & Voice Services** | OpenAI GPT-4o, Google Gemini, OpenAI Whisper | Conversational intent processing, hands-free voice transcription |
| **Charts & Visualization** | Apache ECharts, AmCharts | Interactive spending trends, category distributions, breakdown bar charts |
| **Internationalization** | `@ngx-translate/core` | Multi-currency and localized language support |
| **Packaging & Distribution** | Angular PWA / Service Worker, Android TWA | Desktop PWA, Google Play Store distribution |
| **Testing** | Jasmine, Karma, Playwright | Unit tests, component tests, end-to-end integration tests |

---

## 8. Local Development Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Angular CLI**: `npm install -g @angular/cli`

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/prashiln79/money-manager.git
   cd money-manager
   ```

2. **Install project dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Run the interactive configuration utility to initialize environment files:
   ```bash
   npm run config
   ```
   Add your Firebase credentials and optional AI keys in `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: false,
     firebase: {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
     },
     openAI: {
       apiKey: "YOUR_OPENAI_KEY"
     }
   };
   ```

4. **Start the local development server**
   ```bash
   npm start
   # Application opens automatically at http://localhost:4200
   ```

5. **Running Automated Tests**
   ```bash
   # Run Jasmine/Karma unit tests
   npm test

   # Run unit tests in headless mode with coverage
   npm run test:ci

   # Run Playwright End-to-End (E2E) tests
   npm run test:e2e

   # Run Playwright in interactive UI mode
   npm run test:e2e:ui
   ```

---

## 9. Deployment

The project is configured for automated static prerendering and zero-downtime deployment to GitHub Pages.

```bash
# Production build with static SEO page prerendering
npm run build

# Production build with automatic asset cache-busting
npm run build:cache-bust

# Full deployment workflow (build + static generation + publish)
npm run deploy
```

The build generates optimized bundles in `dist/money-manager/` alongside pre-rendered static HTML routes (`/landing`, `/privacy-policy`, `/terms-conditions`, `/feedback`, `/data-deletion`) and SPA 404 fallback routing for search engine crawlers.

---

## 10. Roadmap

- [ ] **Automated Background Recurring Processing**: Serverless cloud function triggers to generate transactions automatically for due recurring items without client intervention.
- [ ] **Multi-Country Tax Support**: Expand tax calculation engines beyond India (US 1040, UK HMRC, EU VAT frameworks).
- [ ] **Receipt OCR Scanning**: In-browser document scanner to parse physical receipts directly into transaction fields.
- [ ] **Bank Open API Integration**: Optional read-only bank feed synchronization (Account Aggregator / Plaid / Open Banking).
- [ ] **Multi-Currency Conversion Service**: Automatic real-time exchange rate updates for multi-currency transactions.

---

## 11. Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a dedicated feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes following standard commit conventions:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request detailing your changes.

---

## 12. License

This project is open-source software licensed under the [MIT License](LICENSE).
