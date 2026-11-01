# CLI

```
react-svg-icons [build] [--config <file>] [--check]
```

`build` is the only command and the default, so `react-svg-icons` and `react-svg-icons build` are the same.

| Option | Meaning |
|---|---|
| `--config <file>` | Use this config file |
| `--check` | Write nothing; exit with 1 when the files on disk differ from what would be written |
| `-v`, `--version` | Print the version |
| `-h`, `--help` | Print the usage |

Any other argument stops with `@mrzr/react-svg-icons: unknown argument "--chek" (see --help)` and exit code 1.

---

## Finding the config

Without `--config`, the command looks in the **current directory** (not in parent folders) for, in this order:

1. `react-svg-icons.config.yaml`
2. `react-svg-icons.config.yml`
3. `react-svg-icons.config.json`
4. `.react-svg-iconsrc`
5. `.react-svg-iconsrc.yaml`
6. `.react-svg-iconsrc.yml`
7. `.react-svg-iconsrc.json`

A file whose name ends in `.json` is read as JSON. Every other file is read as YAML, which includes the `.react-svg-iconsrc` file with no extension; JSON is valid YAML, so that file may hold either. A script (`.js`, `.mjs`, `.cjs`, `.ts`, …) is not a config: it stops with `@mrzr/react-svg-icons: <file> is a script; the config must be YAML or JSON`.

With `--config`, that file is used and must exist. Relative `input` and `outDir` are resolved against the folder of the config file, so this works from any directory:

```bash
npx @mrzr/react-svg-icons --config design/react-svg-icons.config.yaml
```

## Writing

```bash
npx @mrzr/react-svg-icons
```

```
✔ 9 files in generated
```

Every file is written, missing folders are created, and a generated file that is no longer produced is deleted together with a folder it leaves empty.

## Checking

```bash
npx @mrzr/react-svg-icons --check
```

It builds in memory and compares with the files on disk. Up to date:

```
✔ icons are up to date (9 files)
```

Otherwise one line per file on stderr, then a hint, and exit code 1:

```
✖ missing: generated/camera.tsx
✖ changed: generated/bold/logout.tsx
✖ leftover: generated/bold/old.tsx
Run `npx @mrzr/react-svg-icons` and commit the result.
```

| Word | Meaning |
|---|---|
| `missing` | An SVG exists and its component is not on disk |
| `changed` | The file on disk differs. Line endings are ignored, so a CRLF checkout passes. |
| `leftover` | A generated file whose SVG is gone |

## Exit codes

| Code | When |
|---|---|
| `0` | Written, up to date, `--help` or `--version` |
| `1` | `--check` found differences, or any error |

Errors are printed to stderr as one message that starts with `react-svg-icons:`. See [[Troubleshooting]].

## In a project

```json
{
  "scripts": {
    "icons": "react-svg-icons",
    "icons:check": "react-svg-icons --check"
  }
}
```

Run `npm run icons:check` in CI next to your tests, with the same prettier and config as locally.
