# Glossary

## Sourdough terms

| Term | Meaning |
|---|---|
| **Starter** (sourdough, *surdej*) | Flour and water with living wild yeast and bacteria, kept alive by regular feeding and used to raise bread |
| **Old sourdough** / old starter | The starter taken from the jar before feeding. Its weight is the "1" in a ratio |
| **Feeding** | Mixing old starter with fresh flour and water |
| **Feeding ratio** | Weights of starter : flour : water. 1:5:5 = 5 g flour and 5 g water per 1 g starter |
| **Hydration** | Water ÷ flour by weight. 100 % = equal weights. **Stiff** starters are about 50–60 %, **liquid** starters 100 % or more |
| **Peak** | The highest, most active point after feeding, before the starter falls back. The app predicts the middle of it |
| **Lag phase** | The first part after feeding, while the microbes adapt and little happens |
| **Rise phase** | The microbes multiply and produce gas; the starter grows |
| **Decline** | After the peak: food runs out, the starter sinks and gets more sour |
| **Whole grain** (*fuldkorn*) | Flour that keeps the bran and germ. Ferments faster than white flour |
| **White / sifted / refined flour** | Bran and germ removed |
| **Extraction rate** | Share of the grain that ends up in the flour. Higher means more whole grain |
| **Ash content** | Mineral content of flour, measured by burning it. Higher in whole grain |
| **Sweet sourdough** | A starter fed with added sugar, for example before a sweet dough |
| **Lievito madre** | Italian stiff starter used for sweet breads like panettone |

## Microbiology terms

| Term | Meaning |
|---|---|
| **Yeast** | Single-celled fungus that makes most of the gas that raises a starter. The usual sourdough yeast is *Kazachstania* (formerly *Candida*) *humilis* |
| **Lactic acid bacteria (LAB)** | Bacteria that make the sourness (lactic and acetic acid). Typical: *Fructilactobacillus sanfranciscensis* |
| **Maltose** | The main sugar released from flour starch. The bacteria use it; the usual sourdough yeast cannot |
| **Osmotic stress** | When there is a lot of dissolved sugar or salt, water is pulled out of the microbes and they slow down |
| **Water activity** | How available water is for microbes (pure water = 1.0). Sugar lowers it. Below about 0.9 most sourdough microbes stop growing |
| **Optimum temperature** | The temperature where a microbe grows fastest |
| **Ratkowsky model** | A standard formula for microbial growth rate against temperature. The app uses its extended form |

## Code terms

| Term | Meaning |
|---|---|
| **Persona** | A saved starter in the code (`SourdoughPersona`, `usePersonas`). The UI says "starter" |
| **Factor** / **multiplier** | One part of the peak-time formula; 1.0 = no change, above 1 = slower |
| **Reference feed** | All-purpose flour, 1:1:1, 24 °C, no sugar = 3.5 h. Every factor is 1.0 for it |
| **Calibration factor** | Per-starter multiplier learned from logged feeds, 0.6–1.6 |
| **Sweet feed** | A logged feed with `sugarAmount > 0`. Calibrated separately |
| **Ratio solver** | `calculateRequiredRatio`: works out the ratio for a target time |
| **Conditions factor** | `conditionsFactor`: everything in the formula except the ratio. Shared by prediction and solver |
| **Input mode** | `'basic'` (Normal), `'target-window'`, `'total-sourdough'` |
| **Suggestion** | A translation key for a tip shown under the results |
| **`localStorage`** | Browser storage where all data is saved |
| **SPA** | Single-page application: one HTML page updated by JavaScript |
| **`HashRouter`** | React Router mode that keeps the route after `#` in the URL, so it works on static hosting |
| **shadcn/ui** | A collection of React components copied into `src/components/ui` |
| **Mermaid** | Text format for diagrams, drawn by GitHub; used in these docs |
