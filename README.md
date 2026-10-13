# Sourdough Peak Planner

Know when your sourdough starter will peak, and how to feed it so it peaks when you need it.

**Use it:** <https://bendfeldt.github.io/sourdoughpeakplanner-ff7502f5/>

- Predicts the peak from flour blend, feeding ratio, hydration, temperature (10–40 °C) and added sugar (up to the weight of the flour).
- Works backwards: give a time window or a total amount, and it recommends the feeding ratio and grams.
- Learns each starter's own speed from feeds you log.
- Several starters, English and Danish, all in the browser. No account; data stays on your device.

## Documentation

Start at **[docs/README.md](docs/README.md)**.

| Page | About |
|---|---|
| [Architecture](docs/architecture.md) | How the code fits together |
| [Fermentation model](docs/fermentation-model.md) | The peak-time formula and the science behind it |
| [Calculation modes](docs/calculation-modes.md) | Normal, Target Window, Total Sourdough |
| [Calibration](docs/calibration.md) | How the app learns from logged feeds |
| [Data and storage](docs/data-storage.md) | What is saved in the browser |
| [Development](docs/development.md) | Run, test and change the code |
| [Deployment](docs/deployment.md) | Publishing to GitHub Pages |
| [Glossary](docs/glossary.md) | Baking and code terms |

AI coding agents: see [AGENTS.md](AGENTS.md).

## Quick start

```sh
npm ci
npm run dev     # http://localhost:8080
npm test
```

Requires Node.js 22.18 or newer. Built with Vite, React, TypeScript, Tailwind CSS and shadcn/ui. The project was started in [Lovable](https://lovable.dev).
