import { execFileSync } from "node:child_process";
import {
  access,
  cp,
  mkdtemp,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  utimes,
} from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";

const RELEASE_PATHS = ["manifest.json", "extension", "shared", "icons"];
const DIST_DIRECTORY = "dist";
const ARCHIVE_PATH = resolve(DIST_DIRECTORY, "bookmarklet-script-manager.zip");
const ARCHIVE_TIMESTAMP = new Date("1980-01-01T00:00:00Z");
const ARCHIVE_TIMEZONE = "UTC";

try {
  await validateReleaseInputs();
} catch (error) {
  throw new Error(`Cannot package extension: ${error.message}`, { cause: error });
}

await mkdir(DIST_DIRECTORY, { recursive: true });
await rm(ARCHIVE_PATH, { force: true });

const stagingDirectory = await mkdtemp(join(tmpdir(), "bookmarklet-script-manager-"));

try {
  for (const releasePath of RELEASE_PATHS) {
    await cp(releasePath, join(stagingDirectory, releasePath), { recursive: true });
  }

  const archiveEntries = await normalizedFiles(stagingDirectory);

  try {
    execFileSync("zip", ["-X", "-q", ARCHIVE_PATH, ...archiveEntries], {
      cwd: stagingDirectory,
      env: { ...process.env, TZ: ARCHIVE_TIMEZONE },
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("Cannot package extension: the zip executable is unavailable.");
    }
    throw error;
  }
} finally {
  await rm(stagingDirectory, { force: true, recursive: true });
}

async function validateReleaseInputs() {
  let manifest;
  try {
    manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error('manifest.json is missing.');
    throw new Error('manifest.json is invalid JSON.');
  }

  const entries = [
    manifest.background?.service_worker,
    manifest.action?.default_popup,
    manifest.options_page,
    ...Object.values(manifest.icons || {}),
  ].filter(Boolean);

  for (const entry of entries) {
    await assertReleaseFile(entry, 'required manifest entry');
  }

  const moduleEntries = [manifest.background?.service_worker].filter(Boolean);
  for (const entry of moduleEntries) {
    await validateModuleImports(entry, new Set());
  }
}

async function assertReleaseFile(path, description) {
  try {
    await access(path);
  } catch {
    throw new Error(`${description} is missing: ${path}`);
  }
}

async function validateModuleImports(modulePath, visited) {
  if (visited.has(modulePath)) return;
  visited.add(modulePath);

  const source = await readFile(modulePath, 'utf8');
  const imports = source.matchAll(/from\s+['"](\.\.?\/[^'"]+)['"]/g);
  for (const match of imports) {
    const importedPath = resolve(join(modulePath, '..'), match[1]);
    await assertReleaseFile(importedPath, `local module imported by ${modulePath}`);
    await validateModuleImports(importedPath, visited);
  }
}

async function normalizedFiles(directory) {
  const entries = [];

  for (const releasePath of RELEASE_PATHS) {
    await collectNormalizedFiles(directory, releasePath, entries);
  }

  return entries.sort();
}

async function collectNormalizedFiles(rootDirectory, path, entries) {
  const fullPath = join(rootDirectory, path);
  const info = await stat(fullPath);

  if (info.isDirectory()) {
    const children = await readdir(fullPath);
    for (const child of children.sort()) {
      await collectNormalizedFiles(rootDirectory, join(path, child), entries);
    }
  } else {
    entries.push(relative(rootDirectory, fullPath));
  }

  await utimes(fullPath, ARCHIVE_TIMESTAMP, ARCHIVE_TIMESTAMP);
}
