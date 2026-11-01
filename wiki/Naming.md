# Naming

Three names are made from each SVG: the component, its file, and its key in the registry.

---

## The component name

From the file name, in this order:

1. The file name is split into words at spaces, hyphens, underscores, digits and capital letters.
2. If the first word is `icon`, it goes, and so do the numbers right after it (`Icon 24 Home` gives `Home`).
3. Words in `removeWords` go (compared without regard to case).
4. Words that are also in the folder's name go (`bold-logout.svg` in `bold/` gives `Logout`).
5. The rest are joined, each with a capital first letter: `CalendarAdd`.
6. A name that starts with a digit gets `Icon` in front. A name with nothing left is `Icon`.

| File | In folder | Component | Written to |
|---|---|---|---|
| `Icon 24 Home.svg` | `bold` | `Home` | `bold/home.tsx` |
| `camera.svg` | `icons` (the input folder) | `Camera` | `camera.tsx` |
| `calendar-add.svg` | `linear` | `CalendarAdd` | `linear/calendar-add.tsx` |
| `bold-logout.svg` | `bold` | `Logout` | `bold/logout.tsx` |
| `ic linear eye.svg` | `linear`, with `removeWords: [ic]` | `Eye` | `linear/eye.tsx` |
| `add_road-round.svg` | `icons` | `AddRoadRound` | `add-road-round.tsx` |
| `2FA.svg` | any | `Icon2Fa` | `icon2fa.tsx` |
| `icon.svg` | any | `Icon` | `icon.tsx` |

Every component also exports its props type: `HomeProps`.

## The file name

The component name with a hyphen between a lower-case letter and a capital, and then lower-cased: `CalendarAdd` is `calendar-add.tsx`, `Icon2Fa` is `icon2fa.tsx`.

## Two icons with one name

In one folder, the second gets a number: `AB`, then `AB2`, `AB3`, with files `ab.tsx`, `ab2.tsx`. Which one is first depends on the file order ([[Input-Format]]).

## Names the tool keeps for itself

An SVG whose component file would be `index.tsx` (anywhere), or `icon.tsx` or `registry.tsx` (at the top of the input folder), stops the run with `@mrzr/react-svg-icons: <file> would be written to icon.tsx, a name the generated icon file already uses; rename the SVG`. Without that, it would overwrite the generated file, or sit beside it with the same import name. `icon.svg` and `registry.svg` inside a variant folder are fine.

## The registry name

`<variant>.<file name without .tsx>`:

| Where the SVG is | Registry name |
|---|---|
| `bold/logout.svg` | `bold.logout` |
| `a/b/x.svg` | `a.b.x` |
| `camera.svg`, at the top | `<input folder name>.camera`, for `input: icons` that is `icons.camera` |

The name of the input folder is part of the registry name of top-level icons, so renaming that folder renames them. Two icons with the same registry name stop the run.

## Folder names in the exports

A variant folder is exported from its parent as a namespace in camel case: `my-folder` as `myFolder`, and a name starting with a digit as `folder3d`. The top-level `index.ts` exports only the registry and `Icon`, on purpose ([[Icon-Component]]).
