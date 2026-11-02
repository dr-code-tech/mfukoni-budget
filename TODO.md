# Mfukoni budget — delivery outcomes

## Transaction and category management
- [x] Users can record income and expenses with an amount, date, category, and optional description; create and use categories for organizing income and expense transactions; and review, edit, and remove their own transactions.

## Monthly category budgets
- [x] Users can set a monthly spending budget for each expense category, choose the month they are reviewing, and see per category how much has been spent and how much of the budget remains (including when a category is over budget).

## Dashboard, charts, and insights
- [x] The monthly dashboard summarizes income, expenses, total budget, and remaining funds for the selected month.
- [x] The dashboard visualizes spending by category, provides a month-over-month spending trend chart, and generates plain-English insights that flag notable budget performance (for example, “Dining is 32% over budget”).

## CSV data portability
- [x] Users can import transaction and budget data from CSV; validate the imported records and show a reviewable error summary before accepting valid rows.
- [x] Users can export their locally stored transaction and budget data to CSV.

## GitHub source mirror
- [ ] Push the complete Mfukoni budget application source and build configuration to the user's repository `dr-code-tech/mfukoni-budget`, preserving its existing GitHub history and README while keeping Manus as the canonical project repository.

## Android release artifact
- [ ] Provide a signed, installable Android APK as a GitHub Release asset. Configure Android 8.0/API 26 as the minimum and support devices through current Android 17/API 37; verify the built artifact before publishing it.

## Local-first mobile experience
- [x] All personal financial data persists locally in the browser (and on-device local storage in a native app build), without requiring an account or remote database for budget data.
- [x] Core flows work in a portrait, one-handed mobile layout, with a useful first-run empty state rather than invented transactions.
