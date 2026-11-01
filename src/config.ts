import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

export interface ReactSvgIconsConfig {
  /** Folder with the exported `*.svg` files. Subfolders become variants. */
  input: string;
  /** Folder the components are written to. */
  outDir: string;
  /** Words dropped from every icon name, in any case: `[vuesax, icon]`. */
  removeWords?: string[];
  /** The `size` an icon has when none is given. Default 24. */
  defaultSize?: number;
  /** The `strokeWidth` of an icon whose SVG has none. Default 2. */
  defaultStrokeWidth?: number;
  /** `"prettier"` formats with the project's prettier and its config; `false` writes raw. Default `"prettier"`. */
  format?: "prettier" | false;
}

export interface ResolvedConfig {
  input: string;
  outDir: string;
  removeWords: string[];
  defaultSize: number;
  defaultStrokeWidth: number;
  format: "prettier" | false;
}

const OPTIONS = ["input", "outDir", "removeWords", "defaultSize", "defaultStrokeWidth", "format"];

export function defineConfig(config: ReactSvgIconsConfig): ReactSvgIconsConfig {
  return config;
}

export function resolveConfig(config: ReactSvgIconsConfig): ResolvedConfig {
  for (const key of Object.keys(config)) {
    if (!OPTIONS.includes(key)) {
      throw new Error(
        `react-svg-icons: unknown option "${key}" (options: ${OPTIONS.join(", ")})`,
      );
    }
  }
  if (!config.input) throw new Error("react-svg-icons: `input` is required");
  if (!config.outDir) throw new Error("react-svg-icons: `outDir` is required");
  const number = (name: string, value: number | undefined, fallback: number) => {
    if (value === undefined) return fallback;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      throw new Error(`react-svg-icons: \`${name}\` must be a positive number`);
    }
    return value;
  };
  if (config.removeWords !== undefined && !Array.isArray(config.removeWords)) {
    throw new Error("react-svg-icons: `removeWords` must be a list of words");
  }
  if (config.format !== undefined && config.format !== "prettier" && config.format !== false) {
    throw new Error('react-svg-icons: `format` must be "prettier" or false');
  }
  return {
    input: config.input,
    outDir: config.outDir,
    removeWords: (config.removeWords ?? []).map((w) => String(w).toLowerCase()),
    defaultSize: number("defaultSize", config.defaultSize, 24),
    defaultStrokeWidth: number("defaultStrokeWidth", config.defaultStrokeWidth, 2),
    format: config.format ?? "prettier",
  };
}

const CONFIG_NAMES = [
  "react-svg-icons.config.yaml",
  "react-svg-icons.config.yml",
  "react-svg-icons.config.json",
  ".react-svg-iconsrc",
  ".react-svg-iconsrc.yaml",
  ".react-svg-iconsrc.yml",
  ".react-svg-iconsrc.json",
];

const SCRIPT = /\.(c|m)?(j|t)s$/;

export function findConfig(cwd: string, explicit?: string): string {
  if (explicit) {
    const file = path.resolve(cwd, explicit);
    if (!existsSync(file)) throw new Error(`react-svg-icons: no config at ${file}`);
    return file;
  }
  for (const name of CONFIG_NAMES) {
    const file = path.resolve(cwd, name);
    if (existsSync(file)) return file;
  }
  throw new Error(
    `react-svg-icons: no config found; create ${CONFIG_NAMES[0]} (see the README)`,
  );
}

export async function loadConfig(file: string): Promise<ReactSvgIconsConfig> {
  if (SCRIPT.test(file)) {
    throw new Error(`react-svg-icons: ${file} is a script; the config must be YAML or JSON`);
  }
  const text = readFileSync(file, "utf8").replace(/^﻿/, "");
  const isJson = file.endsWith(".json");
  let parsed: unknown;
  try {
    parsed = isJson ? JSON.parse(text) : parseYaml(text);
  } catch (error) {
    throw new Error(
      `react-svg-icons: ${file} is not valid ${isJson ? "JSON" : "YAML"} (${(error as Error).message})`,
    );
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`react-svg-icons: ${file} must hold a mapping of options`);
  }
  return parsed as ReactSvgIconsConfig;
}
