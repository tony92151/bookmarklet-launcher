import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { cp, mkdtemp, readFile, rm, utimes } from "node:fs/promises";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const execFile = promisify(execFileCallback);
const PACKAGER_PATH = resolve("scripts/package-extension.mjs");
const ARCHIVE_NAME = "bookmarklet-script-manager.zip";
const PRIVACY_POLICY_URL =
  "https://tony92151.github.io/bookmarklet-launcher/site/privacy.html";

test("release packager defines a strict extension-file allowlist", async () => {
  const source = await readFile("scripts/package-extension.mjs", "utf8");

  assert.match(source, /manifest\.json/);
  assert.match(source, /['"]extension['"]/);
  assert.match(source, /['"]shared['"]/);
  assert.match(source, /['"]icons['"]/);
  assert.doesNotMatch(source, /site\/|fixtures\/|docs\//);
});

test("release packager creates a deterministic archive without stale entries", async (t) => {
  const projectDirectory = await mkdtemp(join(tmpdir(), "package-extension-"));
  t.after(() => rm(projectDirectory, { force: true, recursive: true }));

  for (const path of ["manifest.json", "extension", "shared", "icons"]) {
    await cp(path, join(projectDirectory, path), { recursive: true });
  }

  await runPackager(projectDirectory);
  const archivePath = join(projectDirectory, "dist", ARCHIVE_NAME);
  const firstHash = await archiveHash(archivePath);

  await utimes(join(projectDirectory, "manifest.json"), new Date("2000-01-01"), new Date("2000-01-01"));
  await runPackager(projectDirectory);
  assert.equal(await archiveHash(archivePath), firstHash);

  await rm(join(projectDirectory, "extension", "background.js"));
  await runPackager(projectDirectory);

  assert.deepEqual(await archiveEntries(archivePath), [
    "extension/options/index.html",
    "extension/options/index.js",
    "extension/options/styles.css",
    "extension/popup/index.html",
    "extension/popup/index.js",
    "extension/popup/styles.css",
    "extension/storage.js",
    "icons/icon128.png",
    "icons/icon16.png",
    "icons/icon48.png",
    "manifest.json",
    "shared/bookmarklet.js",
  ]);
});

test("release package links options to the published privacy policy", async (t) => {
  const projectDirectory = await mkdtemp(join(tmpdir(), "package-extension-"));
  t.after(() => rm(projectDirectory, { force: true, recursive: true }));

  for (const path of ["manifest.json", "extension", "shared", "icons"]) {
    await cp(path, join(projectDirectory, path), { recursive: true });
  }

  await runPackager(projectDirectory);
  const options = await archiveFile(
    join(projectDirectory, "dist", ARCHIVE_NAME),
    "extension/options/index.html",
  );

  assert.ok(options.includes(`href="${PRIVACY_POLICY_URL}"`));
});

test("release package is byte-identical across host timezones", async (t) => {
  const projectDirectory = await mkdtemp(join(tmpdir(), "package-extension-"));
  t.after(() => rm(projectDirectory, { force: true, recursive: true }));

  for (const path of ["manifest.json", "extension", "shared", "icons"]) {
    await cp(path, join(projectDirectory, path), { recursive: true });
  }

  await runPackager(projectDirectory, "UTC");
  const archivePath = join(projectDirectory, "dist", ARCHIVE_NAME);
  const utcHash = await archiveHash(archivePath);

  await runPackager(projectDirectory, "Asia/Taipei");

  assert.equal(await archiveHash(archivePath), utcHash);
});

async function runPackager(cwd, timezone) {
  await execFile(process.execPath, [PACKAGER_PATH], {
    cwd,
    env: timezone ? { ...process.env, TZ: timezone } : process.env,
  });
}

async function archiveHash(archivePath) {
  return createHash("sha256").update(await readFile(archivePath)).digest("hex");
}

async function archiveEntries(archivePath) {
  const { stdout } = await execFile("unzip", ["-Z1", archivePath]);
  return stdout.trim().split("\n").sort();
}

async function archiveFile(archivePath, path) {
  const { stdout } = await execFile("unzip", ["-p", archivePath, path]);
  return stdout;
}
