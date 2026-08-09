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
