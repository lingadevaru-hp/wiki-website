import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const publicDir = new URL(
  "../artifacts/thoshan-wiki/public/",
  import.meta.url,
);

test("ARD manifest describes the published Markdown guide", () => {
  const manifest = JSON.parse(
    readFileSync(new URL(".well-known/ard.json", publicDir), "utf8"),
  );
  const [entry] = manifest.entries;

  assert.equal(manifest.entries.length, 1);
  assert.match(
    entry.identifier,
    /^urn:air:lingadevaru\.in:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/,
  );
  assert.ok(entry.displayName);
  assert.equal(entry.type, "text/markdown");
  assert.equal(entry.url, "https://lingadevaru.in/llms.txt");
  assert.equal(entry.data, undefined);
  assert.equal(entry.representativeQueries.length, 2);

  const guide = readFileSync(new URL("llms.txt", publicDir), "utf8");
  assert.match(guide, /^# .+/);
  assert.match(guide, /^\s*-\s+\[[^\]]+\]\(https:\/\/lingadevaru\.in\//m);
  assert.match(guide, /robots\.txt/);
});
