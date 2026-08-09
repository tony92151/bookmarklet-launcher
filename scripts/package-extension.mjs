import { access, mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const RELEASE_PATHS = ["manifest.json", "extension", "shared", "icons"];
const DIST_DIRECTORY = "dist";
const ARCHIVE_PATH = `${DIST_DIRECTORY}/bookmarklet-script-manager.zip`;

try {
  await access("manifest.json");
} catch {
  throw new Error("Cannot package extension: manifest.json is missing.");
}

await mkdir(DIST_DIRECTORY, { recursive: true });
await rm(ARCHIVE_PATH, { force: true });

execFileSync("zip", ["-X", "-r", ARCHIVE_PATH, ...RELEASE_PATHS], {
  stdio: "inherit",
});
