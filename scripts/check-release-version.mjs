import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function parseChromeVersion(version) {
  if (typeof version !== "string" || !/^(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*)){0,3}$/.test(version)) {
    throw new Error(`Invalid Chrome version: ${JSON.stringify(version)}. Use 1–4 numeric components without a v prefix or leading zeros.`);
  }

  const components = version.split(".").map(Number);
  if (components.every((component) => component === 0) || components.some((component) => component > 65535)) {
    throw new Error(`Invalid Chrome version: ${JSON.stringify(version)}. Components must be 0–65535 and the version cannot be all zeros.`);
  }
  return components;
}

export function compareChromeVersions(left, right) {
  const leftComponents = parseChromeVersion(left);
  const rightComponents = parseChromeVersion(right);
  for (let index = 0; index < 4; index += 1) {
    const difference = (leftComponents[index] ?? 0) - (rightComponents[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

export function checkReleaseVersion(requested, manifestVersion, releaseTags, existingTags) {
  parseChromeVersion(requested);
  parseChromeVersion(manifestVersion);
  if (requested !== manifestVersion) {
    throw new Error(`Requested version ${requested} must exactly match manifest.json version ${manifestVersion}.`);
  }

  for (const tag of releaseTags) {
    const version = tag.startsWith("v") ? tag.slice(1) : tag;
    try {
      parseChromeVersion(version);
    } catch {
      throw new Error(`Cannot compare published release tag ${JSON.stringify(tag)} as a Chrome version.`);
    }
    if (compareChromeVersions(requested, version) <= 0) {
      throw new Error(`Requested version ${requested} must be greater than published release version ${version}.`);
    }
  }

  if (existingTags.includes(`v${requested}`)) {
    throw new Error(`Git tag v${requested} already exists.`);
  }
}

async function main() {
  const requested = process.env.RELEASE_VERSION;
  const releaseTagsFile = process.env.RELEASE_TAGS_FILE;
  if (!releaseTagsFile) throw new Error("RELEASE_TAGS_FILE is required.");

  const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
  const releaseTags = (await readFile(releaseTagsFile, "utf8")).split(/\r?\n/).filter(Boolean);
  const existingTags = execFileSync("git", ["tag", "--list"], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
  checkReleaseVersion(requested, manifest.version, releaseTags, existingTags);
  console.log(`Version ${requested} is valid for release.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
