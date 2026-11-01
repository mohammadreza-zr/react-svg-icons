import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { Writable } from "node:stream";
import { test } from "node:test";

import { compare, generate, loadConfig, write } from "../dist/index.js";
import { cleanIconName, toCamelCase, toKebabCase } from "../dist/names.js";
import { bundle, example, project, require, root, run, typecheck } from "./helpers.mjs";

const RAW = "input: icons\noutDir: generated\nformat: false\n";
const read = (dir, file) => readFileSync(join(dir, "generated", file), "utf8");
const generated = (dir) => run(dir).status === 0;

test("the committed example output is what the tool generates", async () => {
  const config = await loadConfig(join(example, "react-svg-icons.config.yaml"));
  assert.deepEqual(compare(await generate(config, example)), []);
});

test("the output is the same every time", async () => {
  const config = await loadConfig(join(example, "react-svg-icons.config.yaml"));
  const a = await generate(config, example);
  const b = await generate(config, example);
  assert.deepEqual(a.files, b.files);
});

test("names: words, numbers, the folder name and removeWords", () => {
  const clean = (file, folder, words = []) => cleanIconName(file, folder, words);
  assert.equal(clean("Icon 24 Home.svg", "bold"), "Home");
  assert.equal(clean("calendar-add.svg", "linear"), "CalendarAdd");
  assert.equal(clean("bold-logout.svg", "bold"), "Logout");
  assert.equal(clean("vuesax linear eye.svg", "linear", ["vuesax"]), "Eye");
  assert.equal(clean("2FA.svg", "x"), "Icon2Fa");
  assert.equal(clean("icon.svg", "x"), "Icon");
  assert.equal(toKebabCase("CalendarAdd"), "calendar-add");
  assert.equal(toCamelCase("my-folder"), "myFolder");
  assert.equal(toCamelCase("3d"), "folder3d");
});

test("two files with the same name get a number, in a stable order", async () => {
  const dir = project();
  mkdirSync(join(dir, "icons/linear"), { recursive: true });
  writeFileSync(join(dir, "icons/linear/a b.svg"), '<svg viewBox="0 0 24 24"><path d="M1 1h2" stroke="#000"/></svg>');
  writeFileSync(join(dir, "icons/linear/a-b.svg"), '<svg viewBox="0 0 24 24"><path d="M2 2h2" stroke="#000"/></svg>');
  writeFileSync(join(dir, "react-svg-icons.config.yaml"), RAW);
  assert.ok(generated(dir));
  const index = read(dir, "linear/index.ts");
  assert.match(index, /export \{ AB \} from "\.\/ab";/);
  assert.match(index, /export \{ AB2 \} from "\.\/ab2";/);
});

test("the registry has one lazy import per icon, keyed variant.name", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW + "removeWords: [icon]\n" });
  assert.ok(generated(dir));
  const registry = read(dir, "registry.ts");
  assert.match(registry, /"icons\.camera": \(\) => import\("\.\/camera"\)\.then\(\(m\) => m\.Camera\),/);
  assert.match(registry, /"bold\.logout": \(\) => import\("\.\/bold\/logout"\)\.then\(\(m\) => m\.Logout\),/);
  assert.match(registry, /"bold\.home": \(\) => import\("\.\/bold\/home"\)\.then\(\(m\) => m\.Home\),/);
  assert.match(registry, /"bulk\.eye": /);
  assert.doesNotMatch(read(dir, "index.ts"), /bold|bulk/);
});

test("colour slots: the most used opaque colour is slot 0, translucent ones come last", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  assert.ok(generated(dir));
  assert.match(read(dir, "camera.tsx"), /colors\[0\] = #1d1b20\n \* - colors\[1\] = #fff/);
  const eye = read(dir, "bulk/eye.tsx");
  assert.match(eye, /colors\[0\] = #292d32\n \* - colors\[1\] = #292d32/);
  assert.match(eye, /opacity: opacities\?\.\[1\] \?\? opacity \?\? 0\.4/);
});

test("the generated code type-checks under strict mode against the real React types", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  assert.ok(generated(dir));
  const result = typecheck(dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

function render(element) {
  const { renderToStaticMarkup } = require("react-dom/server");
  return renderToStaticMarkup(element);
}

function renderLazy(element) {
  const { renderToPipeableStream } = require("react-dom/server");
  return new Promise((resolve, reject) => {
    let html = "";
    const sink = new Writable({
      write(chunk, _encoding, done) {
        html += chunk.toString();
        done();
      },
      final(done) {
        resolve(html);
        done();
      },
    });
    const stream = renderToPipeableStream(element, { onAllReady: () => stream.pipe(sink), onError: reject });
  });
}

test("the components render, and every prop does what the docs say", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  assert.ok(generated(dir));
  const { createElement: h } = require("react");
  const { Camera } = bundle(dir, "camera.tsx");
  const { Logout } = bundle(dir, "bold/logout.tsx");
  const { Eye } = bundle(dir, "bulk/eye.tsx");

  const plain = render(h(Camera));
  assert.match(plain, /^<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">/);
  assert.match(plain, /style="fill:currentColor"/);
  assert.match(render(h(Camera, { size: 32 })), /width="32" height="32"/);
  assert.match(render(h(Camera, { color: "red" })), /style="fill:red"/);
  assert.match(render(h(Camera, { colors: ["blue"] })), /style="fill:blue"/);
  assert.match(render(h(Camera, { colors: ["blue"] })), /<circle[^>]*style="fill:currentColor"/);
  assert.match(render(h(Camera, { title: "Camera" })), /role="img"[^>]*><title>Camera<\/title>/);
  assert.doesNotMatch(render(h(Camera, { title: "Camera" })), /aria-hidden/);
  assert.match(render(h(Camera, { className: "x", "data-id": "7" })), /class="x"/);

  assert.match(render(h(Logout)), /stroke-width="1\.5"/);
  assert.match(render(h(Logout, { strokeWidth: 3 })), /stroke-width="3"/);
  assert.match(render(h(Logout, { strokeWidths: [4] })), /stroke-width="4"/);
  assert.match(render(h(Logout, { stroke: "teal" })), /style="stroke:teal"/);

  assert.match(render(h(Eye)), /<path[^>]*style="fill:currentColor;opacity:0\.4"/);
  assert.match(render(h(Eye, { opacities: [1, 0.9] })), /opacity:0\.9/);
  assert.match(render(h(Eye, { opacity: 0.5 })), /opacity:0\.5/);
});

test("Icon loads the icon of a registry name lazily and renders it", async () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  assert.ok(generated(dir));
  const { createElement: h } = require("react");
  const { Icon } = bundle(dir, "icon.tsx");
  const html = await renderLazy(h(Icon, { name: "bold.logout", size: 20, className: "k" }));
  assert.match(html, /<svg[^>]*width="20"[^>]*class="k"[^>]*>/);
  assert.match(html, /<path /);
  // Icon always passes strokeWidth (default 2), so it overrides the width the SVG itself has (1.5).
  assert.match(html, /stroke-width="2"/);
  const { Logout } = bundle(dir, "bold/logout.tsx");
  assert.match(render(h(Logout)), /stroke-width="1\.5"/);
});

test("Icon defaults come from the config", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW + "defaultSize: 18\ndefaultStrokeWidth: 1\n" });
  assert.ok(generated(dir));
  assert.match(read(dir, "icon.tsx"), /size: 18,\n  color: "currentColor",\n  strokeWidth: 1,/);
  assert.match(read(dir, "camera.tsx"), /size = 18,/);
  assert.match(read(dir, "bulk/eye.tsx"), /strokeWidth = 1,/);
});

test("write removes a generated file that is no longer produced, and nothing else", async () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  assert.ok(generated(dir));
  writeFileSync(join(dir, "generated/mine.ts"), "export const mine = 1;\n");
  mkdirSync(join(dir, "generated/gone"));
  writeFileSync(join(dir, "generated/gone/old.tsx"), "/* eslint-disable */\n/* This file is auto-generated by react-svg-icons. Do not edit manually. */\n");
  const config = await loadConfig(join(dir, "react-svg-icons.config.yaml"));
  const output = await generate(config, dir);
  assert.deepEqual(compare(output).map((d) => `${d.reason}:${d.path.split("generated/")[1]}`), ["leftover:gone/old.tsx"]);
  write(output);
  assert.ok(existsSync(join(dir, "generated/mine.ts")), "a file the tool did not write stays");
  assert.ok(!existsSync(join(dir, "generated/gone")), "the emptied folder goes too");
  assert.deepEqual(compare(output), []);
});

test("--check lists what is missing, changed and left over, and exits with 1", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  assert.equal(run(dir, "--check").status, 1);
  assert.match(run(dir, "--check").stderr, /missing: generated\/camera\.tsx/);
  assert.ok(generated(dir));
  const fresh = run(dir, "--check");
  assert.equal(fresh.status, 0);
  assert.match(fresh.stdout, /✔ icons are up to date \(9 files\)/);
  writeFileSync(join(dir, "generated/camera.tsx"), readFileSync(join(dir, "generated/camera.tsx"), "utf8") + "// x\n");
  assert.match(run(dir, "--check").stderr, /changed: generated\/camera\.tsx/);
});

test("--check ignores line endings, so a CRLF checkout passes", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  assert.ok(generated(dir));
  for (const f of ["camera.tsx", "registry.ts"]) {
    const p = join(dir, "generated", f);
    writeFileSync(p, readFileSync(p, "utf8").replace(/\n/g, "\r\n"));
  }
  assert.equal(run(dir, "--check").status, 0);
});

test("errors name the file or the folder", async () => {
  const bad = project({ "react-svg-icons.config.yaml": RAW });
  writeFileSync(join(bad, "icons/broken.svg"), "<svg><path d=");
  const broken = run(bad);
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /react-svg-icons: .*broken\.svg is not a valid SVG/);

  const notSvg = project({ "react-svg-icons.config.yaml": RAW });
  writeFileSync(join(notSvg, "icons/empty.svg"), '<g><path d="M0 0h1"/></g>');
  assert.match(run(notSvg).stderr, /react-svg-icons: .*empty\.svg is not a valid SVG/);

  const missing = project({ "react-svg-icons.config.yaml": "input: nope\noutDir: generated\n" });
  assert.match(run(missing).stderr, /input folder not found: .*nope/);

  const none = project({ "react-svg-icons.config.yaml": "input: empty\noutDir: generated\n" });
  mkdirSync(join(none, "empty"));
  assert.match(run(none).stderr, /no \.svg files in .*empty/);

  const same = project({ "react-svg-icons.config.yaml": "input: icons\noutDir: .\n" });
  assert.match(run(same).stderr, /outDir \(.*\) must not hold the input folder/);
});

test("the output folder is never wiped: a file of yours beside the icons survives a run", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  mkdirSync(join(dir, "generated"));
  writeFileSync(join(dir, "generated/keep.txt"), "mine");
  assert.ok(generated(dir));
  assert.equal(readFileSync(join(dir, "generated/keep.txt"), "utf8"), "mine");
  rmSync(join(dir, "generated"), { recursive: true });
});

test("format: prettier uses the project's own prettier config; false writes the raw text", () => {
  const raw = project({ "react-svg-icons.config.yaml": RAW });
  assert.ok(generated(raw));
  assert.match(read(raw, "registry.ts"), /"bold\.logout": \(\) => import\("\.\/bold\/logout"\)\.then\(\(m\) => m\.Logout\),\n/);

  const formatted = project({
    "react-svg-icons.config.yaml": "input: icons\noutDir: generated\n",
    ".prettierrc": '{ "semi": false, "singleQuote": true }',
  });
  assert.ok(generated(formatted));
  const registry = read(formatted, "registry.ts");
  assert.match(registry, /as const\n/);
  assert.doesNotMatch(registry, /as const;/);
  assert.match(read(formatted, "bold/index.ts"), /export \{ Logout \} from '\.\/logout'\n/);
});

test("a formatted run passes --check with the same config, and fails when the config changes", () => {
  const dir = project({ "react-svg-icons.config.yaml": "input: icons\noutDir: generated\n", ".prettierrc": '{ "semi": false }' });
  assert.ok(generated(dir));
  assert.equal(run(dir, "--check").status, 0);
  writeFileSync(join(dir, ".prettierrc"), '{ "semi": true }');
  assert.match(run(dir, "--check").stderr, /changed: generated\/registry\.ts/);
});

test("a nested folder is part of the name, so equal folder names do not collide", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  const svg = '<svg viewBox="0 0 24 24"><path d="M1 1h2" stroke="#000"/></svg>';
  for (const p of ["a/b", "c/b"]) {
    mkdirSync(join(dir, "icons", p), { recursive: true });
    writeFileSync(join(dir, "icons", p, "x.svg"), svg);
  }
  assert.ok(generated(dir));
  const registry = read(dir, "registry.ts");
  assert.match(registry, /"a\.b\.x": \(\) => import\("\.\/a\/b\/x"\)/);
  assert.match(registry, /"c\.b\.x": \(\) => import\("\.\/c\/b\/x"\)/);
  assert.equal(typecheck(dir).status, 0);
});

test("two icons with the same name are an error that names both", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  const svg = '<svg viewBox="0 0 24 24"><path d="M1 1h2" stroke="#000"/></svg>';
  mkdirSync(join(dir, "icons/icons"));
  writeFileSync(join(dir, "icons/icons/camera.svg"), svg);
  const r = run(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /two icons have the name "icons\.camera": \.\/camera and \.\/icons\/camera/);
});

test("what the SVG says that a prop replaces is dropped: style, stroke-width, ids stay", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  writeFileSync(
    join(dir, "icons/mixed.svg"),
    '<svg viewBox="0 0 24 24" fill="none"><defs><clipPath id="clip0"><rect width="24" height="24"/></clipPath></defs><g clip-path="url(#clip0)"><path fill-rule="evenodd" d="M1 1h4v4H1z" style="mix-blend-mode:multiply" stroke="#111" stroke-width="3"/><path d="M8 8h4" stroke="#111" stroke-width="1"/><path d="M9 9h4" stroke="#111" stroke-width="1"/></g></svg>',
  );
  assert.ok(generated(dir));
  const code = read(dir, "mixed.tsx");
  assert.doesNotMatch(code, /mix-blend-mode|mixBlendMode/);
  assert.doesNotMatch(code, /stroke-width|strokeWidth="/);
  assert.match(code, /strokeWidth = 3,/, "after svgo merges the two equal paths there is one shape of each width, and a tie takes the first");
  assert.match(code, /<clipPath id=\{"clip0"\}>/);
  assert.match(code, /clipPath=\{"url\(#clip0\)"\}/);
});

test("a folder with no SVG at any depth writes nothing, and is not exported", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  mkdirSync(join(dir, "icons/empty"));
  mkdirSync(join(dir, "icons/bold/inner/deeper"), { recursive: true });
  writeFileSync(join(dir, "icons/bold/inner/notes.txt"), "not an icon");
  assert.ok(generated(dir));
  assert.ok(!existsSync(join(dir, "generated/empty")));
  assert.ok(!existsSync(join(dir, "generated/bold/inner")));
  assert.doesNotMatch(read(dir, "bold/index.ts"), /inner/);
  assert.equal(typecheck(dir).status, 0);
});

test("an SVG named like a generated file is an error, not a silent overwrite", () => {
  const svg = '<svg viewBox="0 0 24 24"><path d="M1 1h2" stroke="#000"/></svg>';
  for (const [where, name] of [["icons", "icon"], ["icons", "registry"], ["icons", "index"], ["icons/bold", "index"]]) {
    const dir = project({ "react-svg-icons.config.yaml": RAW });
    writeFileSync(join(dir, where, `${name}.svg`), svg);
    const r = run(dir);
    assert.equal(r.status, 1, `${where}/${name}`);
    assert.match(r.stderr, new RegExp(`${name}\\.svg would be written to ${name}\\.tsx, a name the generated ${name} file already uses; rename the SVG`), `${where}/${name}`);
  }
  const fine = project({ "react-svg-icons.config.yaml": RAW });
  writeFileSync(join(fine, "icons/bold/icon.svg"), svg);
  writeFileSync(join(fine, "icons/bold/registry.svg"), svg);
  assert.ok(generated(fine), "icon and registry are only reserved at the top");
});

test("a hole in colors leaves that slot to the fallbacks", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  assert.ok(generated(dir));
  const { createElement: h } = require("react");
  const { Camera } = bundle(dir, "camera.tsx");
  const html = render(h(Camera, { colors: [undefined, "red"], color: "gray" }));
  assert.match(html, /<path[^>]*style="fill:gray"/);
  assert.match(html, /<circle[^>]*style="fill:red"/);
});

test("IconName rejects a name that is not in the registry, at type-check time", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  assert.ok(generated(dir));
  writeFileSync(
    join(dir, "generated/usage.tsx"),
    'import { Icon } from "./index";\nexport const ok = <Icon name="bold.logout" />;\nexport const bad = <Icon name="bold.logut" />;\n',
  );
  const tsc = require.resolve("typescript/bin/tsc");
  const r = spawnSync(
    process.execPath,
    [tsc, "--ignoreConfig", "--noEmit", "--strict", "--skipLibCheck", "--jsx", "react-jsx", "--module", "esnext", "--moduleResolution", "bundler", "--types", "node", "--typeRoots", join(root, "node_modules/@types"), join(dir, "generated/usage.tsx")],
    { cwd: dir, encoding: "utf8" },
  );
  assert.equal(r.status, 2);
  assert.match(r.stdout, /usage\.tsx\(3,\d+\): error TS2820: Type '"bold\.logut"' is not assignable to type .*Did you mean '"bold\.logout"'\?/);
  assert.doesNotMatch(r.stdout, /usage\.tsx\(2,/);
});

test("Icon renders nothing for an unknown name and says so on stderr outside production", () => {
  const dir = project({ "react-svg-icons.config.yaml": RAW });
  assert.ok(generated(dir));
  bundle(dir, "icon.tsx");
  const script = `const { createElement: h } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { Icon } = require(${JSON.stringify(join(dir, "js/icon.cjs"))});
console.log(JSON.stringify(renderToStaticMarkup(h(Icon, { name: "nope.nope" }))));`;
  const r = spawnSync(process.execPath, ["-e", script], { cwd: root, encoding: "utf8", env: { ...process.env, NODE_ENV: "development" } });
  assert.equal(r.stdout.trim(), '""');
  assert.match(r.stderr, /\[Icon\] Unknown icon name: "nope\.nope"\./);
  const prod = spawnSync(process.execPath, ["-e", script], { cwd: root, encoding: "utf8", env: { ...process.env, NODE_ENV: "production" } });
  assert.equal(prod.stderr.trim(), "");
});
