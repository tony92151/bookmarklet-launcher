import { execFileSync } from "node:child_process";
import {
  access,
  cp,
  mkdtemp,
  mkdir,
  readdir,
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
  await access("manifest.json");
} catch {
  throw new Error("Cannot package extension: manifest.json is missing.");
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
