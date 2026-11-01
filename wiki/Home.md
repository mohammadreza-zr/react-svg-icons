# @mrzr/react-svg-icons

Turn a folder of SVG files into typed React components (TSX). Every icon gets props for its size and colours, so you can restyle it without editing the SVG.

```bash
npm install --save-dev @mrzr/react-svg-icons
npx @mrzr/react-svg-icons
```

---

## What it does

| | |
|---|---|
| **A component per SVG** | Optimised with SVGO, typed, with a forwarded `ref`, `size`, `color`, `stroke`, `fill`, `strokeWidth`, `opacity` and a `title` that makes it accessible. |
| **A prop per colour** | `colors={["red", "blue"]}` sets the first and the second colour of the drawing; `opacities` and `strokeWidths` do the same. See [[Components]]. |
| **A lazy `Icon`** | `<Icon name="bold.logout" />`: the name is typed, and each icon is its own chunk. See [[Icon-Component]]. |
| **Your formatting** | The output is formatted with your project's prettier and its config, so it is the file your own formatting would leave. |
| **A freshness check** | `--check` exits with 1 when an SVG was added, changed or removed and the components were not regenerated. |
| **Safe cleanup** | A generated file for an SVG you removed is deleted. A file the tool did not write is never touched. |

---

## Limits

What the output does not do. Each one is tested behaviour, not a guess.

- **The `style` attribute of an SVG is dropped.** Presentation attributes (`fill`, `stroke`, `fill-rule`, …) are kept.
- **`stroke-width` becomes one prop for the icon.** The default is the most common width among the shapes left after SVGO has merged them (the first one on a tie). An icon that mixes widths loses the difference unless you pass `strokeWidths`.
- **Gradients are not parameterised.** A `url(#…)` fill stays as it is, and so do gradient stop colours.
- **Ids are not made unique.** A `<clipPath id="clip0">` is written as it is. Two icons with the same id on one page can clash.
- **Imports have no file extension.** The generated code needs a bundler-style resolution (`"moduleResolution": "bundler"`); with `nodenext` TypeScript reports TS2835.
- **No watch mode.** Run it again after you change an SVG.

---

## Pages

| Page | What is in it |
|---|---|
| [[Installation]] | Requirements and how to run it |
| [[Quick-Start]] | From a folder of SVGs to working components |
| [[Input-Format]] | The folder layout and what an SVG may contain |
| [[Naming]] | How component, file and registry names are made |
| [[Components]] | The props of an icon and how colours are numbered |
| [[Icon-Component]] | The lazy `Icon` and the registry |
| [[Configuration]] | Every option |
| [[CLI]] | Commands, flags and exit codes |
| [[API-Reference]] | `generate`, `write`, `compare` and the rest |
| [[Troubleshooting]] | Every error message and what to do |
| [[FAQ]] | Short answers |
| [[Contributing]] | Working on the package, releasing |
