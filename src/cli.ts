#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { compare, generate, write } from "./build.js";
import { findConfig, loadConfig } from "./config.js";

const HELP = `react-svg-icons — SVG icons to typed React components

Usage:
  react-svg-icons [build] [--config <file>] [--check]

Options:
  --config <file>  Config file (default: react-svg-icons.config.yaml|yml|json or .react-svg-iconsrc in the cwd)
  --check          Write nothing; exit 1 when the output on disk is out of date
  -v, --version    Print the version
  -h, --help       Show this help
`;

interface Args {
  check: boolean;
  help: boolean;
  version: boolean;
  config?: string;
}

function parse(argv: string[]): Args {
  const args: Args = { check: false, help: false, version: false };
  const rest = [...argv];
  if (rest[0] === "build") rest.shift();
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--check") args.check = true;
    else if (arg === "-h" || arg === "--help") args.help = true;
    else if (arg === "-v" || arg === "--version") args.version = true;
    else if (arg === "--config") {
      const value = rest[++i];
      if (!value) throw new Error("react-svg-icons: --config needs a file");
      args.config = value;
    } else throw new Error(`react-svg-icons: unknown argument "${arg}" (see --help)`);
  }
  return args;
}

async function main(argv: string[]): Promise<number> {
  const args = parse(argv);
  if (args.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (args.version) {
    const pkg = new URL("../package.json", import.meta.url);
    console.log((JSON.parse(readFileSync(pkg, "utf8")) as { version: string }).version);
    return 0;
  }

  const cwd = process.cwd();
  const file = findConfig(cwd, args.config);
  const config = await loadConfig(file);
  const output = await generate(config, path.dirname(file));

  if (args.check) {
    const differences = compare(output);
    if (differences.length === 0) {
      console.log(`✔ icons are up to date (${output.files.length} files)`);
      return 0;
    }
    for (const d of differences) console.error(`✖ ${d.reason}: ${path.relative(cwd, d.path)}`);
    console.error("Run `npx @mrzr/react-svg-icons` and commit the result.");
    return 1;
  }

  write(output);
  console.log(`✔ ${output.files.length} files in ${path.relative(cwd, output.outDir) || "."}`);
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  },
);
