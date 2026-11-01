# API reference

```js
import { generate, write, compare, defineConfig, resolveConfig, findConfig, loadConfig } from "@mrzr/react-svg-icons";
```

The package is ESM. The command line is built on these functions: `findConfig` → `loadConfig` → `generate` → `write` (or `compare` for `--check`).

---

## `generate(config, cwd?)`

```ts
generate(config: ReactSvgIconsConfig, cwd?: string): Promise<Output>
```

Reads the SVGs, builds every file and formats it. **Writes nothing.** `cwd` is the folder that relative `input` and `outDir` are resolved against, and the folder the project's prettier is looked up from; it defaults to `process.cwd()`.

```ts
interface Output {
  outDir: string;        // absolute
  files: OutputFile[];
}
interface OutputFile {
  path: string;          // absolute
  content: string;
}
```

It rejects with the errors in [[Troubleshooting]].

## `write(output)`

```ts
write(output: Output): void
```

Writes each file, creates the folders, deletes the generated files that are no longer produced and the folders that leaves empty.

## `compare(output)`

```ts
compare(output: Output): Difference[]

interface Difference {
  path: string;
  reason: "missing" | "changed" | "leftover";
}
```

Compares with the disk and writes nothing. An empty array means up to date. Line endings are ignored. This is what `--check` uses.

```js
import { compare, generate, loadConfig, write } from "@mrzr/react-svg-icons";

const config = await loadConfig("react-svg-icons.config.yaml");
const output = await generate(config, process.cwd());
if (compare(output).length > 0) write(output);
```

## `defineConfig(config)`

Returns the object you pass. It only gives your editor the types.

## `resolveConfig(config)`

```ts
resolveConfig(config: ReactSvgIconsConfig): ResolvedConfig
```

Applies the defaults ([[Configuration]]) and lower-cases `removeWords`. Throws when `input` or `outDir` is missing, for an option it does not know, and for a value of the wrong kind. `generate` calls it for you.

## `findConfig(cwd, explicit?)`

```ts
findConfig(cwd: string, explicit?: string): string
```

Returns the absolute path of the config: `explicit` resolved against `cwd`, or the first of the default names found in `cwd`, in the order listed in [[CLI]]. Throws `@mrzr/react-svg-icons: no config at <file>` or `@mrzr/react-svg-icons: no config found; create react-svg-icons.config.yaml (see the README)`.

## `loadConfig(file)`

```ts
loadConfig(file: string): Promise<ReactSvgIconsConfig>
```

Parses a file ending in `.json` as JSON and any other file as YAML. Throws `@mrzr/react-svg-icons: <file> is not valid YAML (…)` (or `JSON`), `@mrzr/react-svg-icons: <file> must hold a mapping of options`, and `@mrzr/react-svg-icons: <file> is a script; the config must be YAML or JSON` for a `.js`, `.mjs`, `.cjs` or `.ts` file. The paths in the result are **not** resolved: pass the folder of the config file as `cwd` to `generate`, as the CLI does.

## Types

`ReactSvgIconsConfig`, `ResolvedConfig`, `Output`, `OutputFile` and `Difference` are exported as types. The fields of `ReactSvgIconsConfig` are the options in [[Configuration]].
