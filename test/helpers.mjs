import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const example = join(root, "examples/basic");
export const cli = join(root, "dist/cli.js");
export const require = createRequire(import.meta.url);

// Inside the repo, so that react and @types/react are found from there.
export const scratch = () => {
  mkdirSync(join(root, ".test-tmp"), { recursive: true });
  return mkdtempSync(join(root, ".test-tmp", "t-"));
};

export const project = (files = {}) => {
  const dir = scratch();
  cpSync(join(example, "icons"), join(dir, "icons"), { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  return dir;
};

export const run = (cwd, ...args) =>
  spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });

// Type-check the way a bundler project does: strict, with the real React types.
export function typecheck(dir) {
  const tsc = require.resolve("typescript/bin/tsc");
  return spawnSync(
    process.execPath,
    [
      tsc, "--ignoreConfig", "--noEmit", "--strict", "--skipLibCheck", "--jsx", "react-jsx",
      "--target", "es2022", "--module", "esnext", "--moduleResolution", "bundler",
      "--types", "node", "--typeRoots", join(root, "node_modules/@types"),
      ...["icon.tsx", "registry.ts", "index.ts"].map((f) => join(dir, "generated", f)),
    ],
    { cwd: dir, encoding: "utf8" },
  );
}

// Run the real code: bundle an entry file (its dynamic imports too) into CommonJS.
export function bundle(dir, entry) {
  const outfile = join(dir, "js", entry.replace(/\.tsx?$/, ".cjs"));
  esbuild.buildSync({
    entryPoints: [join(dir, "generated", entry)],
    bundle: true,
    format: "cjs",
    platform: "node",
    jsx: "automatic",
    external: ["react", "react/jsx-runtime", "react-dom"],
    outfile,
    logLevel: "silent",
  });
  return require(outfile);
}
