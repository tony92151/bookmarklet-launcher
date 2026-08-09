import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("extension UI identifies the product and links its safety disclosures", async () => {
  const popup = await readFile("extension/popup/index.html", "utf8");
  const options = await readFile("extension/options/index.html", "utf8");
  const manifest = JSON.parse(await readFile("manifest.json", "utf8"));

  assert.equal(manifest.name, "Bookmarklet Script Manager");
  assert.match(popup, /only run scripts you trust/i);
  assert.match(popup, /id="recheck-user-scripts"/);
  assert.match(options, /privacy\.html/);
});

test("README documents Chrome-only support and the release package command", async () => {
  const readme = await readFile("README.md", "utf8");

  assert.match(readme, /^# Bookmarklet Script Manager$/m);
  assert.doesNotMatch(readme, /^Bookmarklet Launcher /m);
  assert.match(readme, /Chrome 135\+/);
  assert.doesNotMatch(readme, /Chrome\/Edge extension/);
  assert.match(readme, /node scripts\/package-extension\.mjs/);
});
