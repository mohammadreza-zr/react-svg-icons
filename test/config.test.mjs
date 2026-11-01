import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { generate } from "../dist/index.js";
import { example, project, run } from "./helpers.mjs";

const body = "input: icons\noutDir: out\n";
const json = '{"input":"icons","outDir":"out"}';

test("the config is found as YAML, JSON or an rc file, in every spelling", () => {
  const cases = {
    "react-svg-icons.config.yaml": body,
    "react-svg-icons.config.yml": body,
    "react-svg-icons.config.json": json,
    ".react-svg-iconsrc": body,
    ".react-svg-iconsrc.yaml": body,
    ".react-svg-iconsrc.yml": body,
    ".react-svg-iconsrc.json": json,
  };
  for (const [name, content] of Object.entries(cases)) {
    const dir = project({ [name]: content });
    assert.equal(run(dir).status, 0, name);
    assert.ok(readFileSync(join(dir, "out/registry.ts"), "utf8").includes("iconRegistry"), name);
  }
});

test("an rc file may hold JSON, because JSON is valid YAML", () => {
  assert.equal(run(project({ ".react-svg-iconsrc": json })).status, 0);
});

test("a script is not a config, and the error says what to use", () => {
  const dir = project({ "react-svg-icons.config.mjs": 'export default { input: "icons", outDir: "out" };\n' });
  const r = run(dir, "--config", "react-svg-icons.config.mjs");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /is a script; the config must be YAML or JSON/);
  assert.match(run(dir).stderr, /no config found; create react-svg-icons\.config\.yaml/);
});

test("invalid YAML or JSON, and a config that is not a mapping, name the file", () => {
  const cases = [
    ["react-svg-icons.config.yaml", "input: [icons\n", /react-svg-icons\.config\.yaml is not valid YAML/],
    ["react-svg-icons.config.json", "{ bad", /react-svg-icons\.config\.json is not valid JSON/],
    [".react-svg-iconsrc", "- a\n- b\n", /\.react-svg-iconsrc must hold a mapping of options/],
  ];
  for (const [name, content, pattern] of cases) {
    const r = run(project({ [name]: content }));
    assert.equal(r.status, 1, name);
    assert.match(r.stderr, pattern, name);
  }
});

test("an unknown option is an error that lists the valid ones", async () => {
  await assert.rejects(
    generate({ input: "icons", outDir: "out", removeWord: ["x"] }, example),
    /unknown option "removeWord" \(options: input, outDir, removeWords, defaultSize, defaultStrokeWidth, format\)/,
  );
});

test("input and outDir are required, and the numbers must be positive", async () => {
  await assert.rejects(generate({ outDir: "o" }, example), /`input` is required/);
  await assert.rejects(generate({ input: "icons" }, example), /`outDir` is required/);
  await assert.rejects(generate({ input: "icons", outDir: "o", defaultSize: 0 }, example), /`defaultSize` must be a positive number/);
  await assert.rejects(generate({ input: "icons", outDir: "o", defaultStrokeWidth: "2" }, example), /`defaultStrokeWidth` must be a positive number/);
  await assert.rejects(generate({ input: "icons", outDir: "o", removeWords: "icon" }, example), /`removeWords` must be a list of words/);
  await assert.rejects(generate({ input: "icons", outDir: "o", format: "biome" }, example), /`format` must be "prettier" or false/);
});

test("relative paths are relative to the config file, not to where you run it", () => {
  const dir = project();
  const sub = join(dir, "design");
  writeFileSync(join(dir, "design.yaml"), "input: icons\noutDir: out\n");
  const r = run(dir, "--config", "design.yaml");
  assert.equal(r.status, 0);
  assert.ok(readFileSync(join(dir, "out/camera.tsx"), "utf8").includes("Camera"));
  void sub;
});

test("--version, --help and an unknown argument", () => {
  const dir = project();
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(run(dir, "--version").stdout.trim(), pkg.version);
  assert.match(run(dir, "--help").stdout, /react-svg-icons — SVG icons to typed React components/);
  const bad = run(dir, "--chek");
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /unknown argument "--chek"/);
});
