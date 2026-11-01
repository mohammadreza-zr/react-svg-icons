# @mrzr/react-svg-icons

Turn the SVG icons you export from Figma into typed React components. Each icon takes `size`, `color` and a prop per colour in the drawing, and a lazy `Icon` loads any of them by name.

```bash
npm install --save-dev @mrzr/react-svg-icons
npx @mrzr/react-svg-icons
```

---

## Is this for you?

**Use it if**

- Your icons are SVG files exported from Figma, grouped in folders (`bold/`, `linear/`, …)
- You use React, and want an icon to be a component that takes `size` and `color`
- You want two-tone icons whose colours you can set one by one
- You want CI to fail when someone adds an SVG but forgets to regenerate

**Use something else if not.** It writes React components only: no Vue, Svelte or sprite sheet. If you use one icon set from npm, use that set's own package.

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

## What it does not do

Read these before you adopt it. Each one is tested behaviour, not a guess.

- **React only.** No Vue, Svelte, Solid, or sprite output.
- **The `style` attribute of an SVG is dropped.** Presentation attributes (`fill`, `stroke`, `fill-rule`, …) are kept.
- **`stroke-width` becomes one prop for the icon.** The default is the most common width among the shapes left after SVGO has merged them (the first one on a tie). An icon that mixes widths loses the difference unless you pass `strokeWidths`.
- **Gradients are not parameterised.** A `url(#…)` fill stays as it is, and so do gradient stop colours.
- **Ids are not made unique.** A `<clipPath id="clip0">` is written as it is. Two icons with the same id on one page can clash.
- **`Icon` ignores the stroke width of the SVG.** It always passes `strokeWidth` (default 2). Import the component directly to get the width the SVG has. See [[Icon-Component]].
- **Imports have no file extension.** The generated code needs a bundler-style resolution (`"moduleResolution": "bundler"`); with `nodenext` TypeScript reports TS2835.
- **No watch mode.** Run it again after you export.

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
