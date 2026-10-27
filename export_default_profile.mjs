import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { defaultProfile, profileArtEntries } from "./naming_profiles.mjs";
import * as core from "./neb_core.mjs";

export function defaultProfileDocument(revision = "local") {
  const profile = defaultProfile();
  const sample = {
    ...core.ART_DEFAULTS, title: "Profile Example Title", language: "English",
    season: "03", episode: "07", year: "2026", interviewees: "Profile Guest",
  };
  const artExtensions = {};
  const artExamples = [];
  for (const type of profile.types.filter((item) => item.domain === "art")) {
    for (const size of type.sizes) {
      const filename = core.buildArtFilename(type.name, {
        ...sample, art_tag: size.artTag, aspect_ratio: size.aspectRatio, dimensions: size.dimensions,
      });
      artExtensions[size.artTag] = filename.split(".").at(-1);
    }
    for (const language of ["English", "Spanish"]) {
      for (const [season, episode] of [["01", "02"], ["03", "07"]]) {
        const values = { ...sample, language, season, episode };
        artExamples.push({ type: type.name, values, filenames: profileArtEntries(profile, type.name, values).map((entry) => entry.filename) });
      }
    }
  }
  const titles = [
    "When Hope Calls", "The Christmas Yes List", "TITLE", "Veggie Tales",
    "Hope & Joy", "You + Me", "A+B", "Don't Stop", "God’s Love", "Café @ Home",
    "Word...Word", "A.B!", "A\u00a0B", "Fußball", "日本語 Hope",
  ];
  return {
    schemaVersion: 1,
    source: { name: "NameEverythingBetter", url: "https://michaelbrandonfalk.github.io/NameEverythingBetter/", revision },
    generatedAt: new Date().toISOString(),
    normalization: { titleCharacterSet: "ascii" },
    profile, artExtensions, extraUsageCodes: core.EXTRA_USAGE_TO_PREFIX,
    titleExamples: titles.map((input) => ({ input, output: core.slugify(input) })),
    artExamples,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const output = resolve(process.argv[2] || "default-profile.json");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(defaultProfileDocument(process.env.GITHUB_SHA || "local"), null, 2)}\n`);
  console.log(`Exported current NEB Standard profile: ${output}`);
}
