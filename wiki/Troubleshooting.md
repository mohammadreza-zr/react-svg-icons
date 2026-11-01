# Troubleshooting

Every message below is what the tool prints. `<file>` and `<dir>` stand for absolute paths.

---

## Config

| Message | Cause and fix |
|---|---|
| `@mrzr/react-svg-icons: no config found; create react-svg-icons.config.yaml (see the README)` | None of the names in [[CLI]] is in the folder you ran the command from. Parent folders are not searched. `cd` there, or pass `--config <file>`. |
| `@mrzr/react-svg-icons: no config at <file>` | The file given to `--config` does not exist. |
| ``@mrzr/react-svg-icons: `input` is required`` / ``@mrzr/react-svg-icons: `outDir` is required`` | The config has no such option. |
| `@mrzr/react-svg-icons: unknown option "removeWord" (options: input, outDir, removeWords, defaultSize, defaultStrokeWidth, format)` | A typo, or an option that does not exist. The message lists the valid ones ([[Configuration]]). |
| ``@mrzr/react-svg-icons: `defaultSize` must be a positive number`` (or `defaultStrokeWidth`) | The value is not a number above 0. |
| ``@mrzr/react-svg-icons: `removeWords` must be a list of words`` | `removeWords: icon` instead of `removeWords: [icon]`. |
| ``@mrzr/react-svg-icons: `format` must be "prettier" or false`` | Any other value, such as another formatter's name. |
| `@mrzr/react-svg-icons: <file> is a script; the config must be YAML or JSON` | The config is a `.js`, `.mjs`, `.cjs` or `.ts` file. Write the same options as YAML or JSON. |
| `@mrzr/react-svg-icons: <file> is not valid YAML (<reason>)` / `… is not valid JSON (<reason>)` | The file cannot be parsed. `<reason>` is the parser's message, with the position. |
| `@mrzr/react-svg-icons: <file> must hold a mapping of options` | The file is empty, a list, or a single value. |

## Input

| Message | Cause and fix |
|---|---|
| `@mrzr/react-svg-icons: input folder not found: <dir>` | `input` is resolved against the config file's folder, not where you ran the command. |
| `@mrzr/react-svg-icons: no .svg files in <dir>` | The folder has no file ending in `.svg` at any depth. |
| `@mrzr/react-svg-icons: outDir (<dir>) must not hold the input folder (<dir>)` | `outDir` is the input folder or a folder above it. Choose a separate output folder. |
| `@mrzr/react-svg-icons: <file> is not a valid SVG (<reason>)` | The file cannot be parsed after optimising, or is not an SVG at all. Re-export it. |
| `@mrzr/react-svg-icons: <file> would be written to icon.tsx, a name the generated icon file already uses; rename the SVG` | An SVG whose component file would be `index.tsx`, or `icon.tsx`/`registry.tsx` at the top ([[Naming]]). |
| `@mrzr/react-svg-icons: two icons have the name "icons.camera": ./camera and ./icons/camera` | Two SVGs get one registry name, for example a top-level icon and an icon of the same name in a folder called like the input folder. Rename one. |
| `@mrzr/react-svg-icons: the generated <file> does not parse (<reason>)` | Prettier could not parse a generated file. This is a bug in the tool; run with `format: false` to see the raw file, and open an issue with the SVG. |

## Output

| Message | Cause and fix |
|---|---|
| `@mrzr/react-svg-icons: prettier is not installed, so the output is not formatted. Install it in the project, or set `format: false` to silence this.` | A warning, not an error. The raw text is written. |
| `✖ missing`, `✖ changed`, `✖ leftover` with `--check` | See [[CLI]]. |

---

## When there is no message, but the result is wrong

### TypeScript says TS2835 about `./registry`

```
error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './registry.js'?
```

The generated files import each other without a file extension, which `nodenext` and `node16` do not accept. Use `"moduleResolution": "bundler"`.

### `--check` fails in CI but passes on your machine

`--check` compares text, and the text is formatted by prettier. Use the same prettier version and config on both, and commit your lockfile. Or set `format: false`: the raw text does not depend on prettier.

### A colour prop changes the wrong shape

The slots are numbered by the rules in [[Components]]. Open the generated file: its header lists `colors[0]`, `colors[1]`, … with the colour each one had. Two shapes with the same colour share a slot.

### Two icons on a page show each other's gradient or clip

Ids from the SVGs are kept, so two icons that both define `id="clip0"` clash. Rename the id in one of the SVGs, or do not put both on one page.

### `ReferenceError: process is not defined` in the browser

The `Icon` component reads `process.env.NODE_ENV` when a name is unknown. Make your bundler replace it ([[Icon-Component]]).
