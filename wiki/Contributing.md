# Contributing

```bash
git clone https://github.com/mohammadreza-zr/react-svg-icons.git
cd react-svg-icons
npm install
npm test     # builds, then runs every test
```

---

## Layout

```
src/
  index.ts       public exports: generate, write, compare and the config helpers
  cli.ts         the react-svg-icons command: argument parsing, --check, exit codes
  config.ts      the config type, defaults, resolveConfig, findConfig, loadConfig
  build.ts       reads the folder tree, builds every file, formats, compare and write
  component.ts   one SVG to one component: SVGO, root attributes, the template
  jsx.ts         the SVG tree to JSX: colour slots, opacity, attributes
  color.ts       colour parsing and the numbering of the slots
  names.ts       component, file and folder names
  registry.ts    the registry and the Icon component templates
  format.ts      prettier, the project's own first
  header.ts      the banner that marks a generated file
examples/
  basic/         real SVGs, a config and the committed output
test/
  build.test.mjs   the generator, with real files, the real TypeScript compiler and real React
  config.test.mjs  the config files and the CLI
  docs.test.mjs    checks the docs against the real files
wiki/              these pages
```

## Rules

- **No project names in `src/`.** A word to drop from names belongs in the user's config.
- **The output must not change by accident.** The committed files in `examples/basic/generated` must equal what the tool writes. After a deliberate change, regenerate them:

  ```bash
  npm run build
  cd examples/basic && node ../../dist/cli.js
  ```

- **Tests use real files.** No mocks, stubs or fake timers. The generated code is type-checked with the real compiler against `@types/react`, bundled with esbuild and rendered with `react-dom/server`.
- **Docs are checked.** A code block directly under `<!-- verbatim: path -->` must consist of lines of that file, in order, and every wiki link written in double square brackets must point at a page. `npm test` fails when they do not.
- **A change to behaviour needs the wiki and `CHANGELOG.md` updated.**

## Releasing

1. Update `CHANGELOG.md`.
2. `npm version patch` (or `minor`, `major`) and `git push --follow-tags`.
3. The `release` workflow checks that the tag equals the version in `package.json`, runs the typecheck and the tests on Node 20, 22 and 24, checks the type resolution, publishes to npm with provenance (trusted publishing, no token) and creates the GitHub release.

Trusted publishing is set up once on npmjs.com for the package: Settings → Trusted Publisher → GitHub Actions, user `mohammadreza-zr`, repository `react-svg-icons`, workflow `release.yml`, and the direct `npm publish` allowed.

## The wiki

`wiki/` is the source. Publish it to the GitHub Wiki with:

```bash
npm run docs:sync
```

GitHub creates the wiki repository only once a first page exists. Enable it in the repository settings (Features → Wikis) and create any page in the browser, then run the command; it replaces the pages.
