# @mrzr/react-svg-icons

Turn a folder of SVG files into typed React components (TSX). Every icon gets props for its size and colours, so you can restyle it without editing the SVG.

```bash
npm install --save-dev @mrzr/react-svg-icons
npx react-svg-icons
```

---

## Quick start

Put your SVG files in a folder (subfolders are variants) and add `react-svg-icons.config.yaml` next to your `package.json`:

<!-- verbatim: examples/basic/react-svg-icons.config.yaml -->
```yaml
input: icons
outDir: generated
```

```bash
npx react-svg-icons           # writes the components into generated/
npx react-svg-icons --check   # writes nothing; exit code 1 when they are out of date
```

Use an icon by name, loaded on demand, or import it directly:

```tsx
import { Icon } from "./generated";
import { Logout } from "./generated/bold";

<Icon name="bold.logout" size={20} />
<Logout size={20} color="crimson" />
```

The config can also be `.yml`, `.json` or an rc file (`.react-svg-iconsrc`).

---

## What you get

- **A typed component per SVG**, optimised with SVGO, with a forwarded `ref`
- **Props to customise it**: `size`, `color`, `stroke`, `fill`, `strokeWidth`, `opacity`, `title`, and `colors`, `opacities`, `strokeWidths` lists that set the colours of the drawing one by one
- **A typed `name`** for `Icon`: `name="bold.logut"` is a type error, and each icon loads as its own chunk
- **Output formatted by your own prettier**, so it matches what your formatting would leave
- **`--check`** for CI, and cleanup of generated files whose SVG you removed. A file the tool did not write is never touched

---

## Documentation

Everything is in the **[Wiki](https://github.com/mohammadreza-zr/react-svg-icons/wiki)**:

- **Start:** [Installation](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Installation) · [Quick start](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Quick-Start)
- **Guides:** [Input format](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Input-Format) · [Naming](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Naming) · [Components](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Components) · [The Icon component](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Icon-Component)
- **Reference:** [Configuration](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Configuration) · [CLI](https://github.com/mohammadreza-zr/react-svg-icons/wiki/CLI) · [API](https://github.com/mohammadreza-zr/react-svg-icons/wiki/API-Reference)
- **Help:** [Troubleshooting](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Troubleshooting) · [FAQ](https://github.com/mohammadreza-zr/react-svg-icons/wiki/FAQ) · [Contributing](https://github.com/mohammadreza-zr/react-svg-icons/wiki/Contributing)

## Requirements

Node.js 20 or newer. The generated code needs React (tested with 19) and, in TypeScript, `"moduleResolution": "bundler"`, because its imports have no file extension.

## License

MIT
