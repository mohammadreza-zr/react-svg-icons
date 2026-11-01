import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

interface Prettier {
  resolveConfig(file: string): Promise<object | null>;
  format(source: string, options: object): Promise<string>;
}

/** The project's own prettier first, then the one installed next to this package. */
async function loadPrettier(cwd: string): Promise<Prettier | null> {
  try {
    const found = createRequire(path.join(cwd, "noop.js")).resolve("prettier");
    return (await import(pathToFileURL(found).href)).default;
  } catch {
    try {
      return (await import("prettier")).default;
    } catch {
      return null;
    }
  }
}

export async function formatFiles(
  files: { path: string; content: string }[],
  cwd: string,
  format: "prettier" | false,
): Promise<{ path: string; content: string }[]> {
  if (format === false) return files;
  const prettier = await loadPrettier(cwd);
  if (!prettier) {
    console.warn(
      "react-svg-icons: prettier is not installed, so the output is not formatted. " +
        "Install it in the project, or set `format: false` to silence this.",
    );
    return files;
  }
  const config = (await prettier.resolveConfig(path.join(cwd, "package.json"))) ?? {};
  const out: { path: string; content: string }[] = [];
  for (const file of files) {
    try {
      out.push({
        path: file.path,
        content: await prettier.format(file.content, { ...config, parser: "typescript", filepath: file.path }),
      });
    } catch (error) {
      throw new Error(`react-svg-icons: the generated ${file.path} does not parse (${(error as Error).message})`);
    }
  }
  return out;
}
