# Quick start

This page uses [`examples/basic`](https://github.com/mohammadreza-zr/react-svg-icons/tree/main/examples/basic). Its output is committed, and the tests regenerate it and fail if it differs, so what is shown here is what the tool really writes.

---

## 1. Export the SVGs

Put your icons as SVG files in one folder. Subfolders are variants. The example has one icon at the top and two variants:

```
icons/
  camera.svg
  bold/
    Icon 24 Home.svg
    logout.svg
  bulk/
    eye.svg
```

What the files may contain is in [[Input-Format]].

## 2. Write the config

`react-svg-icons.config.yaml`, next to your `package.json`:

<!-- verbatim: examples/basic/react-svg-icons.config.yaml -->
```yaml
input: icons
outDir: generated
```

`input` and `outDir` are the only required options. Relative paths are relative to the folder that holds the config file. Every option is in [[Configuration]].

## 3. Run it

```bash
npx @mrzr/react-svg-icons
```

```
✔ 9 files in generated
```

Add scripts so everyone runs it the same way:

```json
{
  "scripts": {
    "icons": "react-svg-icons",
    "icons:check": "react-svg-icons --check"
  }
}
```

## 4. What was written

```
generated/
  camera.tsx            the component Camera
  bold/home.tsx         Home
  bold/logout.tsx       Logout
  bold/index.ts         exports Home and Logout
  bulk/eye.tsx          Eye
  bulk/index.ts
  registry.ts           the name → lazy import table
  icon.tsx              the lazy Icon component
  index.ts              exports the registry and Icon
```

The registry has one line per icon, keyed `variant.name`:

<!-- verbatim: examples/basic/generated/registry.ts -->
```ts
export const iconRegistry = {
  "icons.camera": () => import("./camera").then((m) => m.Camera),
  "bold.home": () => import("./bold/home").then((m) => m.Home),
  "bold.logout": () => import("./bold/logout").then((m) => m.Logout),
  "bulk.eye": () => import("./bulk/eye").then((m) => m.Eye),
} as const;
```

How the names are made is in [[Naming]].

## 5. Use it

By name, loaded on demand:

```tsx
import { Icon } from "./generated";

<Icon name="bold.logout" size={20} />
```

`name` is typed: it is one of `"icons.camera"`, `"bold.home"`, `"bold.logout"`, `"bulk.eye"`. An icon at the top of the input folder takes that folder's name (`icons`). More in [[Icon-Component]].

Or import one directly, which gives you its own stroke width and no loading step:

```tsx
import { Logout } from "./generated/bold";

<Logout size={20} color="crimson" />
```

Every prop, and how the colours of a two-tone icon are numbered, is in [[Components]].

## 6. Keep it fresh in CI

Commit the generated files and run the check next to your tests:

```bash
npx @mrzr/react-svg-icons --check
```

It prints `✔ icons are up to date (9 files)` and exits with 0, or lists what differs and exits with 1.
