# Input format

The input is a folder of SVG files, as Figma exports them. Subfolders are variants.

---

## Which files are read

- Every file whose name ends in `.svg` (any case of the extension), at any depth below `input`.
- Anything else in the folder is ignored.
- Folders and files are read in name order (plain character order: capitals come before lower-case letters). This sets the order of the registry, and which of two icons with the same name gets the number ([[Naming]]).
- At least one `.svg` must exist.

```
icons/
  camera.svg          a top-level icon
  bold/
    Icon 24 Home.svg  a variant called "bold"
    logout.svg
  bulk/
    eye.svg
```

A folder inside a folder is a nested variant: `icons/a/b/x.svg` is registered as `a.b.x` and exported from `a/b/index.ts`, and `a/index.ts` exports it as the namespace `b`.

## What an SVG may contain

The tool reads the SVG after optimising it with SVGO (the default preset, with id clean-up turned off). It needs an `<svg>` root. Then:

| In the SVG | In the component |
|---|---|
| `width`, `height` | Dropped. The `size` prop sets both. |
| `viewBox` | Kept. Without one, it is built from `width` and `height`, and from 24 if those are missing too. |
| `fill` and `stroke` colours | Each distinct colour becomes a numbered slot you can set ([[Components]]). A colour of `none`, `transparent`, `currentColor`, `inherit` or `url(…)` is not a slot. |
| The root's `fill` | `none` stays `fill="none"`. A colour there becomes a slot. |
| `opacity`, `fill-opacity`, `stroke-opacity` | Kept as the default of the slot's opacity, and a translucent colour sorts after the opaque ones. |
| `stroke-width` | Removed from the shapes. The icon gets one `strokeWidth` prop, defaulting to the most common width. |
| `style` | **Dropped.** |
| `xmlns`, `xmlns:xlink`, `version` | Dropped. |
| Other attributes (`d`, `fill-rule`, `clip-path`, `stroke-linecap`, …) | Kept, in React's spelling (`fillRule`, `clipPath`, `strokeLinecap`). `class` becomes `className`. |
| `id`, `<defs>`, `<clipPath>`, gradients | Kept as they are. Ids are **not** made unique. |

SVGO also rewrites values: `white` becomes `#fff`, paths are shortened, and equal shapes may be merged. The colour list in the header of each component shows what is left.

## Folders with no icon

A folder that holds no SVG at any depth writes nothing and is not exported. This includes a folder that holds only other files.

## Two icons, one name

A top-level icon is registered under the input folder's name (`icons.camera`). A variant folder with the same name as the input folder would give the same name to an icon of the same file name, which stops the run ([[Troubleshooting]]).
