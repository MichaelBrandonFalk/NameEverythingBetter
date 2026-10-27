import test from "node:test";
import assert from "node:assert/strict";
import { defaultProfileDocument } from "../export_default_profile.mjs";
import { defaultProfile, profileArtEntries } from "../naming_profiles.mjs";

test("public default profile is generated from the live engine, including required art", () => {
  const document = defaultProfileDocument("test-revision");
  assert.equal(document.schemaVersion, 1);
  assert.equal(document.source.revision, "test-revision");
  assert.deepEqual(document.profile, defaultProfile());
  assert.deepEqual(document.artExtensions, { ca: "jpg", bg: "jpg", tt: "png" });
  const episode = document.profile.types.find((type) => type.domain === "art" && type.name === "Episode");
  assert.equal(episode.variants.length, 2);
  for (const example of document.artExamples) {
    assert.deepEqual(example.filenames, profileArtEntries(defaultProfile(), example.type, example.values).map((entry) => entry.filename));
  }
  assert.equal(JSON.parse(JSON.stringify(document)).profile.id, "neb-standard");
});
