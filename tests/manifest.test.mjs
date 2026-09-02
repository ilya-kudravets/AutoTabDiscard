import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("Manifest declares a valid lightweight MV3 extension", async () => {
  const manifest = JSON.parse(await readFile(new URL("../manifest.json", import.meta.url)));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.background.service_worker, "background.js");
  assert.ok(manifest.permissions.includes("tabs"));
  assert.equal("content_scripts" in manifest, false);
});