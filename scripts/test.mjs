import { spawnSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../test/", import.meta.url));
const tmp = fileURLToPath(new URL("../.test-tmp", import.meta.url));
const files = readdirSync(dir)
  .filter((name) => name.endsWith(".test.mjs"))
  .map((name) => `${dir}${name}`);

rmSync(tmp, { recursive: true, force: true });
const { status } = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
});
rmSync(tmp, { recursive: true, force: true });
process.exit(status ?? 1);
