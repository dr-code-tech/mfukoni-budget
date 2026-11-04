# Mfukoni budget

An offline-first personal budget app built with Expo, React Native, and TypeScript. It helps you track income and spending, assign categories, set monthly category budgets, and review trends and plain-English budget insights.

## Features

- Record, edit, and remove income and expense transactions with dates, categories, and optional descriptions.
- Set monthly spending limits by expense category and see spent and remaining amounts.
- Review a monthly dashboard with category spending, a month-over-month trend, and budget insights.
- Import and export transactions and budgets as CSV.

## Data and privacy

Budget records are stored locally: in browser storage on Web and on-device AsyncStorage in native builds. No account or remote database is required for budget data. Export CSV backups regularly; clearing browser storage or uninstalling/resetting the app can remove locally stored records. Data does not automatically sync between devices.

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

**Download:** [Mfukoni budget 1.0.0 APK](https://github.com/dr-code-tech/mfukoni-budget/releases/download/v1.0.0/mfukoni-budget-1.0.0.apk) · [Release notes](https://github.com/dr-code-tech/mfukoni-budget/releases/tag/v1.0.0).

The signed APK declares minimum Android API 26 (Android 8.0), targets API 36, and uses version code 10000. It is intended for Android 8.0 and later, including Android 17/API 37; physical-device testing across Android versions has not been performed. The APK archive and Signature Scheme v2 metadata were verified. SHA-256: `c3a0fc02aa728ce7daf8b78c2df55930f827cf4110c823e9683ce760615fdf9f`.

Future native APK/AAB builds should be created through the Manus Dashboard from an accepted project checkpoint, not from the Sandbox.
