# @mrzr/react-svg-icons

[![npm](https://img.shields.io/npm/v/@mrzr/react-svg-icons)](https://www.npmjs.com/package/@mrzr/react-svg-icons)
[![types](https://img.shields.io/npm/types/@mrzr/react-svg-icons)](https://www.npmjs.com/package/@mrzr/react-svg-icons)
[![license](https://img.shields.io/npm/l/@mrzr/react-svg-icons)](LICENSE)

Turn the SVG icons you export from Figma into typed React components. Each icon takes `size`, `color` and a prop per colour in the drawing, and a lazy `Icon` loads any of them by name.

**[Wiki](https://github.com/mohammadreza-zr/react-svg-icons/wiki)** · [Quick start](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Quick-Start) · [Components](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Components) · [Configuration](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Configuration) · [Changelog](https://github.com/mohammadreza-zr/react-svg-icons/blob/main/CHANGELOG.md)

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

**Use something else if not.** It writes React components only: no Vue, Svelte or sprite sheet. For a single icon set from npm, use that set's own package.

---

## Quick start

Put the exported SVGs in a folder (subfolders are variants) and add `react-svg-icons.config.yaml` next to your `package.json`:

<!-- verbatim: examples/basic/react-svg-icons.config.yaml -->
```yaml
input: icons
outDir: generated

# Words dropped from every icon name.
removeWords: [vuesax, icon]
```

```bash
npx @mrzr/react-svg-icons           # writes the components into generated/
npx @mrzr/react-svg-icons --check   # writes nothing; exit code 1 when they are out of date
```

```tsx
import { Icon } from "./generated";
import { Logout } from "./generated/bold";

<Icon name="bold.logout" size={20} />   {/* loaded on demand, the name is typed */}
<Logout size={20} color="crimson" />    {/* imported directly */}
```

The config can also be `.yml`, `.json` or an rc file (`.react-svg-iconsrc`). It is always data, never a script.

---

## What it does

- **One component per SVG**, optimised with SVGO, with `size`, `color`, `stroke`, `fill`, `strokeWidth`, `opacity`, a `title` for accessibility, and a forwarded `ref`
- **A prop per colour**: `colors={["red", "blue"]}` sets the first and the second colour of the drawing, and `opacities` and `strokeWidths` do the same
- **A lazy `Icon`** and a typed registry: `name="bold.logout"`, one chunk per icon
- **Prettier-formatted output** with your project's prettier and its config, so `--check` passes after your own formatting
- **`--check`** and cleanup: a generated file for an SVG you removed is deleted, and nothing else is ever deleted

## What it does not do

No Vue, Svelte or sprite output. Gradients, masks and ids are kept as they are, so two icons that use the same id can clash on one page. The `style` attribute of an SVG is dropped, and `stroke-width` becomes one prop for the whole icon. The [Home](https://github.com/mohammadreza-zr/react-svg-icons/wiki) page lists every limit.

---

## Documentation

Everything is in the **[Wiki](https://github.com/mohammadreza-zr/react-svg-icons/wiki)**:

- **Start:** [Installation](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Installation) · [Quick start](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Quick-Start)
- **Guides:** [Input format](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Input-Format) · [Naming](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Naming) · [Components](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Components) · [The Icon component](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Icon-Component)
- **Reference:** [Configuration](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Configuration) · [CLI](https://github.com/mohammadreza-zr/react-svg-icons/wiki/CLI) · [API](https://github.com/mohammadreza-zr/react-svg-icons/wiki/API-Reference)
- **Help:** [Troubleshooting](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Troubleshooting) · [FAQ](https://github.com/mohammadreza-zr/react-svg-icons/wiki/FAQ) · [Contributing](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Contributing)

## Requirements

Node.js 20 or newer. The generated code needs React (tested with 19) and a bundler-style module resolution (`"moduleResolution": "bundler"` in TypeScript), because its imports have no file extension.

## License

MIT
