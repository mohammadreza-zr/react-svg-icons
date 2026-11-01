# Components

Every SVG becomes a component with the same props. This is the one made from `examples/basic/icons/camera.svg`, rendered with React 19:

```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 4 7.5 6H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-2.5L15 4z" stroke-width="2" style="fill:currentColor"></path><circle cx="12" cy="13" r="3.5" stroke-width="2" style="fill:currentColor"></circle></svg>
```

---

## Props

| Prop | Default | Meaning |
|---|---|---|
| `size` | `24` (option `defaultSize`) | Sets `width` and `height`. |
| `color` | `"currentColor"` | The colour of every shape that has no more specific one. |
| `fill` | none | A fill for every filled shape. |
| `stroke` | none | A stroke colour for every stroked shape. |
| `strokeWidth` | The icon's own width, else `defaultStrokeWidth` | One width for every shape. |
| `opacity` | none | One opacity for every coloured shape. |
| `colors` | none | A list: the colour of slot 0, 1, 2, … See below. |
| `opacities` | none | A list: the opacity of slot 0, 1, 2, … |
| `strokeWidths` | none | A list: the stroke width of slot 0, 1, 2, … |
| `title` | none | Adds a `<title>` and `role="img"`. Without it the icon is `aria-hidden="true"`. |
| `ref` | | Forwarded to the `<svg>`. |
| anything else | | Every other `<svg>` prop (`className`, `onClick`, `aria-label`, …) is passed to the `<svg>` and can override `aria-hidden` and `role`. |

The props type is exported next to the component: `LogoutProps`.

## How a shape gets its colour

Each shape of the drawing that had a colour in the SVG belongs to a **slot**, and the first value that is set wins:

| Of a shape | Order |
|---|---|
| Fill | `colors[slot]`, then `fill`, then `color`, then `"currentColor"` |
| Stroke | `colors[slot]`, then `stroke`, then `color`, then `"currentColor"` |
| Opacity | `opacities[slot]`, then `opacity`, then the opacity the SVG had |
| Stroke width | `strokeWidths[slot]`, then `strokeWidth` |

Leave a hole in a list with `undefined` to set only a later slot: `colors={[undefined, "red"]}`.

## The slots

A **slot** is one distinct colour of the drawing. Two shapes with the same colour share a slot, so one value recolours both. The number of a slot, from 0:

1. Opaque colours before translucent ones. A colour is translucent when its alpha is below 1 (`rgba`), or when the shape's `opacity`, `fill-opacity` or `stroke-opacity` brings it below 1.
2. More used first.
3. On a tie, the one that appears first in the file.

The list is written in a comment at the top of each component, after SVGO has normalised the colours (`white` is `#fff`):

<!-- verbatim: examples/basic/generated/camera.tsx -->
```tsx
 * Original color slots:
 * - colors[0] = #1d1b20
 * - colors[1] = #fff
 */
import * as React from "react";
```

So for the camera, `colors={["#e11d48"]}` recolours the body and leaves the lens as it was:

```html
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" role="img"><title>Camera</title><path d="M9 4 7.5 6H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-2.5L15 4z" stroke-width="2" style="fill:#e11d48"></path><circle cx="12" cy="13" r="3.5" stroke-width="2" style="fill:currentColor"></circle></svg>
```

That is `size={16} colors={["#e11d48"]} title="Camera"`. The lens falls back to `currentColor`, because slot 1 is not set and neither are `fill` and `color`.

The two-tone `eye` icon has a translucent shape and an opaque one. The opaque one is slot 0 and the translucent one is slot 1, so `opacities={[1, 0.2]}` sets the second shape to 0.2:

<!-- verbatim: examples/basic/generated/bulk/eye.tsx -->
```tsx
 * Original color slots:
 * - colors[0] = #292d32
 * - colors[1] = #292d32
 */
import * as React from "react";
```

## Things to know

- **Every coloured shape gets a `strokeWidth`**, also a filled one (the camera above has `stroke-width="2"`). It has no effect without a stroke.
- **The default stroke width** is the most common `stroke-width` among the shapes left after SVGO has merged them, and the first of them on a tie. An SVG with no stroke width uses `defaultStrokeWidth`.
- **The root `<svg>`** keeps `fill="none"` unless the SVG had a root fill, which then is a slot.
- **Colours inside `<defs>`** (a clip path's shape, for example) take a slot too.
