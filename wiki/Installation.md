# Installation

```bash
npm install --save-dev @mrzr/react-svg-icons
# or
pnpm add --save-dev @mrzr/react-svg-icons
yarn add --dev @mrzr/react-svg-icons
```

Without installing it:

```bash
npx @mrzr/react-svg-icons
```

---

## Requirements

| | |
|---|---|
| **Node.js** | 20 or newer, to run the tool. |
| **React** | The generated code uses `forwardRef`, `lazy` and `Suspense`. The tests render it with React 19 and type-check it against `@types/react` 19. |
| **TypeScript** | If you use it: `"moduleResolution": "bundler"`. The generated files import each other without a file extension (`./registry`), which `nodenext` does not accept (error TS2835). |
| **Bundler** | Anything that resolves extensionless imports, and replaces `process.env.NODE_ENV` (the `Icon` warns about an unknown name outside production). Vite and webpack do. |
| **Prettier** | Optional, version 3 or newer. If the project has it, the output is formatted with it. Without it the tool warns and writes the raw text. |

Dependencies installed with it: `svgo` (4.x), `svgson` (5.x) and `yaml` (2.x).

---

## What you get

| Entry | Use |
|---|---|
| `react-svg-icons` (bin) | The command line, see [[CLI]] |
| `@mrzr/react-svg-icons` (import) | `generate`, `write`, `compare` and the config helpers, see [[API-Reference]] |

Next: [[Quick-Start]].
