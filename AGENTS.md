# AGENTS.md

Instructions for AI coding agents working in this repository. Humans are welcome to read it too; the full documentation is in [`docs/`](docs/README.md).

## What this is

A browser-only React app that predicts when a sourdough starter peaks after feeding and how to feed it to peak at a chosen time. No backend: all data is in `localStorage`. Published to GitHub Pages.

Stack: Vite 8, React 19, TypeScript 6, Tailwind CSS 4 (CSS-first config in `src/index.css`, no `tailwind.config`), shadcn/ui, React Router 8 (package `react-router`, `HashRouter`). Node 24 LTS.

## Commands

```sh
npm ci                                   # install
npm test                                 # calculator tests (node:test, no framework)
npx tsc -p tsconfig.app.json --noEmit    # type check
npm run build                            # production build to dist/
npm run lint                             # ESLint; must report 0 errors
npm run dev                              # dev server :8080 (use `npx vite --host 127.0.0.1` without IPv6)
```

Run `npm test`, the type check, `npm run lint` and `npm run build` before every commit. All must pass; `.github/workflows/checks.yml` runs them on every pull request.

## Where things are

| Task | File |
|---|---|
| Peak-time formula, flour and sugar tables, ratio solver, calibration | `src/lib/sourdough-calculator.ts` |
| Tests for the above | `src/lib/sourdough-calculator.test.ts` |
| Shared types (`FlourType`, `SugarType`, `CalculationInput`, `CalculationResult`, `SourdoughPersona`) | `src/types/sourdough.ts` |
| Main screen: all inputs and results | `src/components/SourdoughCalculator.tsx` |
| Saved starters ("personas") | `src/hooks/use-personas.ts` |
| Logged feeds | `src/hooks/use-feeding-history.ts` |
| Backup file, persistent storage request, migrating old starters (`migratePersonas`) | `src/lib/saved-data.ts` |
| English and Danish texts | `src/lib/i18n.tsx` |
| Routes, providers | `src/App.tsx` |
| Fold-out menu (starters, docs) | `src/components/AppMenu.tsx` |
| Docs inside the app | `src/pages/Docs.tsx`, `src/lib/docs.ts` (`DOC_PAGES`) |
| Light/dark mode | `src/hooks/use-theme.ts` |
| GitHub Pages deploy, pull request checks | `.github/workflows/deploy-pages.yml`, `.github/workflows/checks.yml` |

## Rules

### Dependencies

- Stay on TypeScript 6.0. TypeScript 7.0 has no JavaScript API, so typescript-eslint can't support it; move to 7 only once typescript-eslint supports TypeScript 7.1.

### Git

- `main` is protected. Never commit or push to `main`. Work on a branch and open a pull request.
- Do not rewrite history on branches you did not create.

### The fermentation model

Read `docs/fermentation-model.md` before changing it.

- `hours = 3.5 × flour × temperature × ratio × hydration × sugar × calibration`. Each factor is `1.0` for the reference feed (all-purpose, 1:1:1, 24 °C, no sugar). Keep it that way.
- Change factors inside `conditionsFactor()`. It is shared by `rawFermentationHours()` (prediction) and `calculateRequiredRatio()` (solver). Never change only one of them.
- Over 48 h is reported as `exceedsMaxHours`, not clamped silently. Under 1.5 h is raised to 1.5 h.
- Never set the predicted peak to a target time. Always predict from the ratio actually recommended.
- Add a test for every behaviour change.

### Saved data

- State used by more than one component needs one owner. Feeding history lives in `FeedingHistoryProvider` and starters in `PersonasProvider`; read them with `useFeedingHistory()` / `usePersonas()`, never keep a second copy.

- A deploy never clears `localStorage`; the browser does (see `docs/data-storage.md#when-saved-data-disappears`). Anything new that the baker saves must also go into the backup in `src/lib/saved-data.ts`.
- Data from older versions lives in users' browsers. New fields must be optional with a default where read (`x ?? default`).
- Never rename or remove keys of `FLOUR_DATA`, `SUGAR_DATA`, `FlourType`, `SugarType`, or the `localStorage` keys. Add new ones.

### Text and UI

- Make date strings with `format(date, 'yyyy-MM-dd')` from `date-fns`, never `toISOString()` (UTC: wrong day after midnight in Denmark).
- Every visible string goes in `src/lib/i18n.tsx`, in **both** `en` and `da`, and is read with `t('key')`. Never cast keys with `as any`; `t()` is typed so typos fail the type check. Flours and sugars each need `'<key>'` and `'<key>-desc'`.
- Use React Router `<Link>` for internal links, never `<a href="/">` (breaks on GitHub Pages).
- Import routing from `react-router` (not `react-router-dom`).
- Keep `HashRouter` and `base: "./"` in `vite.config.ts`. The deploy workflow refuses branches without `HashRouter`.

### Docs

- Update `docs/` in the same pull request as the code it describes. Numbers in the tables come from running the calculator; regenerate them (see `docs/development.md#updating-the-docs`) instead of estimating.
- Diagrams are Mermaid code blocks. Every diagram must also be explained in text. Prefer `flowchart TB` for long chains so they stay readable on phones.
- New docs files must be added to `DOC_PAGES` in `src/lib/docs.ts`; `npm test` checks this and every docs link.
