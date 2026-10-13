# AGENTS.md

Instructions for AI coding agents working in this repository. Humans are welcome to read it too; the full documentation is in [`docs/`](docs/README.md).

## What this is

A browser-only React app that predicts when a sourdough starter peaks after feeding and how to feed it to peak at a chosen time. No backend: all data is in `localStorage`. Published to GitHub Pages.

Stack: Vite 5, React 18, TypeScript, Tailwind CSS, shadcn/ui, React Router 6 (`HashRouter`). Node 22.18+.

## Commands

```sh
npm ci                                   # install
npm test                                 # calculator tests (node:test, no framework)
npx tsc -p tsconfig.app.json --noEmit    # type check
npm run build                            # production build to dist/
npm run lint                             # ESLint; ~58 errors already exist on main, add none
npm run dev                              # dev server :8080 (use `npx vite --host 127.0.0.1` without IPv6)
```

Run `npm test`, the type check and `npm run build` before every commit. All three must pass.

## Where things are

| Task | File |
|---|---|
| Peak-time formula, flour and sugar tables, ratio solver, calibration | `src/lib/sourdough-calculator.ts` |
| Tests for the above | `src/lib/sourdough-calculator.test.ts` |
| Shared types (`FlourType`, `SugarType`, `CalculationInput`, `CalculationResult`, `SourdoughPersona`) | `src/types/sourdough.ts` |
| Main screen: all inputs and results | `src/components/SourdoughCalculator.tsx` |
| Saved starters ("personas") | `src/hooks/use-personas.ts` |
| Logged feeds | `src/hooks/use-feeding-history.ts` |
| English and Danish texts | `src/lib/i18n.tsx` |
| Routes | `src/App.tsx` |
| GitHub Pages deploy | `.github/workflows/deploy-pages.yml` |

## Rules

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

- State used by more than one component needs one owner. Feeding history lives in `FeedingHistoryProvider`; read it with `useFeedingHistory()`, never keep a second copy.

- Data from older versions lives in users' browsers. New fields must be optional with a default where read (`x ?? default`).
- Never rename or remove keys of `FLOUR_DATA`, `SUGAR_DATA`, `FlourType`, `SugarType`, or the `localStorage` keys. Add new ones.

### Text and UI

- Make date strings with `format(date, 'yyyy-MM-dd')` from `date-fns`, never `toISOString()` (UTC: wrong day after midnight in Denmark).
- Every visible string goes in `src/lib/i18n.tsx`, in **both** `en` and `da`. Flours and sugars need `'<key>'` and flours also `'<key>-desc'`.
- Use React Router `<Link>` for internal links, never `<a href="/">` (breaks on GitHub Pages).
- Keep `HashRouter` and `base: "./"` in `vite.config.ts`. The deploy workflow refuses branches without `HashRouter`.

### Docs

- Update `docs/` in the same pull request as the code it describes. Numbers in the tables come from running the calculator; regenerate them (see `docs/development.md#updating-the-docs`) instead of estimating.
- Diagrams are Mermaid code blocks. Every diagram must also be explained in text.

## Known quirks (not bugs to fix unless asked)

- `src/integrations/supabase` and most of `src/components/ui` are unused template files from Lovable.
