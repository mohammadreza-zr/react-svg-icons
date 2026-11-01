# Changelog

## 0.1.1

- **`Icon` keeps the stroke width of the SVG.** It no longer passes `strokeWidth`, so an icon loaded by name is drawn with the width it has when imported directly (`logout` at 1.5, not 2). `defaultStrokeWidth` now only applies to an SVG that has no `stroke-width`. If you relied on `Icon` forcing the width, pass `strokeWidth` to it.
- The README and the wiki say what the tool does, and no longer mention Figma or other frameworks.
- A test no longer depends on whether `tsc` prints colours, which failed `npm publish` in a terminal that forces them.

## 0.1.0

First release.

- Turns a folder of SVGs into React components: SVGO-optimised, typed, with `size`, `color`, `stroke`, `fill`, `strokeWidth`, `opacity`, `title`, a forwarded `ref`, and `colors`, `opacities` and `strokeWidths` lists with one entry per colour of the drawing.
- Writes a typed registry (`variant.name`, one lazy import per icon) and a lazy `Icon` component. A nested folder is part of the name, and two icons with one name stop the run.
- The config is data, never a script: YAML (`react-svg-icons.config.yaml`, `.yml`), JSON (`react-svg-icons.config.json`) or an rc file (`.react-svg-iconsrc` and its `.yaml`, `.yml` and `.json` variants). Options: `input`, `outDir`, `removeWords`, `defaultSize`, `defaultStrokeWidth`, `format`. An unknown option is an error.
- Formats the output with the project's own prettier and config (`format: prettier`, or `false` for raw text).
- `react-svg-icons --check` reports `missing`, `changed` and `leftover` files and exits with 1; line endings are ignored.
- Never wipes the output folder: only a generated file that a run no longer produces is deleted, with the folder it leaves empty.
- Folders with no SVG are ignored, and an SVG that would overwrite a generated file (`icon`, `registry`, `index`) is an error.
- `generate`, `write` and `compare` for use from a script.
- Requires Node.js 20 or newer.
