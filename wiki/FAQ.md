# FAQ

---

### Why not SVGR?

[SVGR](https://react-svgr.com) turns an SVG into a component too. This tool does that for a whole folder of Figma exports and adds what an icon set needs: a prop per colour (`colors`, `opacities`, `strokeWidths`), a typed registry with a lazy `Icon`, names made from the folder structure, cleanup, and a `--check` for CI. If you need one component from one SVG, SVGR is enough.

### Why does the registry say `icons.camera` for a top-level icon?

An icon directly in the input folder has no variant, so it takes the input folder's own name. With `input: icons` it is `icons.camera`; with `input: assets/exported` it is `exported.camera`. Put icons in a variant folder to choose the name. See [[Naming]].

### How do I recolour only the second colour of a two-tone icon?

`colors={[undefined, "red"]}`. A hole falls back to `fill`/`stroke`, then `color`, then `currentColor`. Which slot is which is written at the top of the generated file ([[Components]]).

### Why is `white` written as `#fff` in the colour list?

SVGO runs first and shortens colours. The list shows what is left after it.

### Why does `Icon` draw a thicker icon than the component I import?

`Icon` always passes `strokeWidth` (2 by default), the imported component uses the width its SVG has. Set `defaultStrokeWidth` to your set's width, or pass `strokeWidth`. See [[Icon-Component]].

### Can I use the icons in a server component?

The icon components have no hooks or state and can render on the server. `icon.tsx` starts with `"use client"` because it uses `React.lazy` and `Suspense` with a client-side import; import the components directly in a server component.

### Why are the files formatted?

So that they are the same files your own formatting would leave. Without it, a lint-staged run would change every generated file at commit time and `--check` would never pass. Set `format: false` to write the raw text.

### What happens to files I add in the output folder?

Nothing. Only a `.ts` or `.tsx` file that carries the tool's banner and that a run no longer produces is deleted.

### Can I turn off the lazy loading?

The registry is always lazy, but nothing makes you use it: import a component from its variant folder (`./generated/bold`) and it is a normal static import.

### Why does an icon with different stroke widths lose them?

The component has one `strokeWidth`, with `strokeWidths` per colour slot. The width written in the SVG is removed from the shapes and the most common one becomes the default. See [[Input-Format]].

### Why Node 20?

Every dependency runs on older versions; Node 20 is the oldest the tests run on.
