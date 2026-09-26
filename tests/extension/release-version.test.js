import assert from "node:assert/strict";
import test from "node:test";

import {
  checkReleaseVersion,
  compareChromeVersions,
  parseChromeVersion,
} from "../../scripts/check-release-version.mjs";

test("Chrome versions compare numeric components and treat omitted trailing zeros as equal", () => {
  assert.equal(compareChromeVersions("1.10", "1.9.99"), 1);
  assert.equal(compareChromeVersions("1.0", "1.0.0"), 0);
  assert.equal(compareChromeVersions("1.0.0.1", "1.0.1"), -1);
});

test("Chrome versions reject invalid input", () => {
  for (const value of ["", "v1.0.0", "1.0.0-beta", "1.0.0.0.1", "1.65536", "01.0", "0", "0.0.0", "1..0", "1.0 "]) {
    assert.throws(() => parseChromeVersion(value), /Chrome version/);
  }
});

test("first release accepts a version matching the manifest", () => {
  assert.doesNotThrow(() => checkReleaseVersion("1.0.0", "1.0.0", [], []));
});

test("release version must exactly match the checked-out manifest", () => {
  assert.throws(
    () => checkReleaseVersion("1.0.1", "1.0.0", [], []),
    /manifest\.json.*1\.0\.0/,
  );
});

test("release version must exceed every published release", () => {
  assert.doesNotThrow(() => checkReleaseVersion("1.10.0", "1.10.0", ["v1.9.0", "v1.2.0"], []));
  assert.throws(
    () => checkReleaseVersion("1.9.0", "1.9.0", ["v1.9"], []),
    /greater than.*1\.9/,
  );
  assert.throws(
    () => checkReleaseVersion("1.8.0", "1.8.0", ["v1.9.0"], []),
    /greater than.*1\.9\.0/,
  );
});

test("release version rejects a pre-existing tag", () => {
  assert.throws(
    () => checkReleaseVersion("1.0.1", "1.0.1", [], ["v1.0.1"]),
    /tag.*already exists/,
  );
});

test("release version fails closed for non-version release tags", () => {
  assert.throws(
    () => checkReleaseVersion("1.0.1", "1.0.1", ["preview"], []),
    /release tag.*preview/,
  );
});
