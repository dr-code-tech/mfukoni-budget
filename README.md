# Mfukoni budget

An offline-first personal budget app built with Expo, React Native, and TypeScript. It helps you track income and spending, assign categories, set monthly category budgets, and review trends and plain-English budget insights.

## Features

- Record, edit, and remove income and expense transactions with dates, categories, and optional descriptions.
- Set monthly spending limits by expense category and see spent and remaining amounts.
- Review a monthly dashboard with category spending, a month-over-month trend, and budget insights.
- Import and export transactions and budgets as CSV.

## Data and privacy

Budget records are stored locally: in browser storage on Web and on-device AsyncStorage in native builds. No account or remote database is required for budget data. Export CSV backups regularly; clearing browser storage or uninstalling/resetting the app can remove locally stored records.

## Run the project

Requirements: Node.js and pnpm 9.12.0 (see `package.json`). Install dependencies and start the Expo Web/Metro and API development processes:

```sh
pnpm install
pnpm dev
```

Useful checks:

```sh
pnpm check
pnpm lint
pnpm exec vitest run tests/budget-model.test.ts
```

The app's budget functionality is client-side. The bundled API server comes from the managed Expo starter and is not the storage location for budget records.

## Android compatibility and release

The Android minimum SDK is 26 (Android 8.0). The project uses Expo SDK 57's Android target SDK 36 and is intended to run on current Android 17 devices (API 37) in platform compatibility mode. Device-specific validation remains necessary for a release.

Create native APK/AAB builds through the Manus Dashboard from an accepted project checkpoint; do not attempt a release build from the Sandbox. A signed APK will be added to [GitHub Releases](https://github.com/dr-code-tech/mfukoni-budget/releases) after a Dashboard build is completed and verified.
