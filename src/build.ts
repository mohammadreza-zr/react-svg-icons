import { existsSync, mkdirSync, readFileSync, readdirSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { formatFiles } from "./format.js";
import { generateComponentCode } from "./component.js";
import { resolveConfig, type ReactSvgIconsConfig, type ResolvedConfig } from "./config.js";
import { HEADER, MARKER } from "./header.js";
import { cleanIconName, toCamelCase, toKebabCase } from "./names.js";
import { iconComponentCode, registryCode, type IconFile } from "./registry.js";

export interface OutputFile {
  path: string;
  content: string;
}

export interface Output {
  outDir: string;
  files: OutputFile[];
}

export interface Difference {
  path: string;
  reason: "missing" | "changed" | "leftover";
}

interface Tree {
  name: string;
  path: string[];
  files: { name: string; fullPath: string }[];
  children: Tree[];
}

function buildTree(dir: string, basePath: string[] = []): Tree {
  const node: Tree = { name: path.basename(dir), path: basePath, files: [], children: [] };
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) node.children.push(buildTree(fullPath, [...basePath, entry.name]));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".svg")) node.files.push({ name: entry.name, fullPath });
  }
  return node;
}

const hasIcons = (node: Tree): boolean => node.files.length > 0 || node.children.some(hasIcons);

interface Walked {
  name: string;
  camelName: string;
  allFiles: IconFile[];
}

function walkTree(node: Tree, isRoot: boolean, outDir: string, config: ResolvedConfig, out: OutputFile[]): Walked {
  const currentDir = isRoot ? outDir : path.join(outDir, ...node.path);
  const generated: { componentName: string; fileName: string }[] = [];
  const used = new Set<string>();
  const allFiles: IconFile[] = [];

  for (const file of node.files) {
    let componentName = cleanIconName(file.name, node.name, config.removeWords);
    const wanted = componentName;
    let counter = 2;
    while (used.has(componentName)) componentName = `${wanted}${counter++}`;
    used.add(componentName);
    const fileName = `${toKebabCase(componentName)}.tsx`;
    const stem = fileName.replace(".tsx", "");
    if (stem === "index" || (isRoot && (stem === "icon" || stem === "registry"))) {
      throw new Error(
        `react-svg-icons: ${file.fullPath} would be written to ${fileName}, a name the generated ${stem} file already uses; rename the SVG`,
      );
    }

    const code = generateComponentCode(readFileSync(file.fullPath, "utf8"), componentName, file.fullPath, config);
    out.push({ path: path.join(currentDir, fileName), content: code });
    generated.push({ componentName, fileName });
    allFiles.push({ componentName, fileName, folderName: node.name, path: node.path });
  }

  const children: Walked[] = [];
  for (const child of node.children.filter(hasIcons)) {
    const result = walkTree(child, false, outDir, config, out);
    children.push(result);
    allFiles.push(...result.allFiles);
  }

  let index = HEADER;
  if (isRoot) {
    // No root-level namespace export on purpose: a static `export * from` of a
    // variant would pull every icon of it into one chunk and defeat the lazy
    // imports of the registry.
    out.push({ path: path.join(currentDir, "registry.ts"), content: registryCode(allFiles) });
    out.push({ path: path.join(currentDir, "icon.tsx"), content: iconComponentCode(config.defaultSize) });
    index += `export * from "./registry";\nexport * from "./icon";\n`;
  } else {
    for (const file of generated) {
      const base = file.fileName.replace(".tsx", "");
      index += `export { ${file.componentName} } from "./${base}";\nexport type { ${file.componentName}Props } from "./${base}";\n`;
    }
    for (const child of children) index += `export * as ${child.camelName} from "./${child.name}";\n`;
  }
  out.push({ path: path.join(currentDir, "index.ts"), content: index });

  return { name: node.name, camelName: toCamelCase(node.name), allFiles };
}

export async function generate(input: ReactSvgIconsConfig, cwd = process.cwd()): Promise<Output> {
  const config = resolveConfig(input);
  const inputDir = path.resolve(cwd, config.input);
  const outDir = path.resolve(cwd, config.outDir);
  if (!existsSync(inputDir)) throw new Error(`react-svg-icons: input folder not found: ${inputDir}`);
  if (outDir === inputDir || inputDir.startsWith(outDir + path.sep)) {
    throw new Error(`react-svg-icons: outDir (${outDir}) must not hold the input folder (${inputDir})`);
  }
  const tree = buildTree(inputDir);
  const files: OutputFile[] = [];
  walkTree(tree, true, outDir, config, files);
  const iconCount = files.filter((f) => f.path.endsWith(".tsx") && !f.path.endsWith(`${path.sep}icon.tsx`)).length;
  if (iconCount === 0) throw new Error(`react-svg-icons: no .svg files in ${inputDir}`);
  return { outDir, files: await formatFiles(files, cwd, config.format) };
}

const lf = (text: string) => text.replace(/\r\n/g, "\n");

function existingGenerated(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...existingGenerated(full));
    else if (/\.tsx?$/.test(entry.name) && readFileSync(full, "utf8").slice(0, 200).includes(MARKER)) found.push(full);
  }
  return found;
}

export function compare(output: Output): Difference[] {
  const wanted = new Set(output.files.map((f) => f.path));
  const differences: Difference[] = [];
  for (const file of output.files) {
    if (!existsSync(file.path)) differences.push({ path: file.path, reason: "missing" });
    else if (lf(readFileSync(file.path, "utf8")) !== lf(file.content)) differences.push({ path: file.path, reason: "changed" });
  }
  for (const file of existingGenerated(output.outDir)) {
    if (!wanted.has(file)) differences.push({ path: file, reason: "leftover" });
  }
  return differences;
}

function removeEmptyDirs(dir: string, keep: string): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) removeEmptyDirs(path.join(dir, entry.name), keep);
  }
  if (dir !== keep && readdirSync(dir).length === 0) rmdirSync(dir);
}

/** Writes the files, and removes only generated files that are no longer produced. */
export function write(output: Output): void {
  for (const file of output.files) {
    mkdirSync(path.dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.content);
  }
  for (const difference of compare(output)) {
    if (difference.reason === "leftover") unlinkSync(difference.path);
  }
  removeEmptyDirs(output.outDir, output.outDir);
}
