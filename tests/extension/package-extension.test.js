import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("release packager defines a strict extension-file allowlist", async () => {
  const source = await readFile("scripts/package-extension.mjs", "utf8");

  assert.match(source, /manifest\.json/);
  assert.match(source, /['"]extension['"]/);
  assert.match(source, /['"]shared['"]/);
  assert.match(source, /['"]icons['"]/);
  assert.doesNotMatch(source, /site\/|fixtures\/|docs\//);
});
