# NEB Modular Core

NEB can now be used by other local apps without running an API service. The reusable entry points are:

- `neb_core.mjs`: pure naming-rule module for browser or Node apps.
- `neb_cli.mjs`: command-line adapter for apps that prefer shelling out and reading JSON.
- `site_logic.mjs`: website UI/controller that imports `neb_core.mjs`.

Keep `neb_core.mjs` as the JavaScript source of truth for website and CLI integrations. The downloadable desktop app is still built from the Python sources, so rule changes should continue to be mirrored there before making a new desktop build.

## Recommended App Integration

Use `neb_core.mjs` directly when the other app is JavaScript:

```js
import {
  buildNebOutputs,
  buildArtOutputs,
  getTaskFields,
  listTasks,
  validateTaskFields,
} from "./neb_core.mjs";

const movie = buildNebOutputs("Movie", {
  title: "Friends and Heroes",
  language: "Spanish",
  resolution: "hd",
  house: "LAS1234567",
});

console.log(movie.filename);
// friends_and_heroes_feature_las_hd_LAS1234567_las.mov

const episodeArt = buildArtOutputs("Episode", {
  title: "Example Name",
  season: "02",
  episode: "05",
  language: "English",
}, { mode: "set" });

console.log(episodeArt.filenames);
// [
//   "example_name_s02_e05_eng_bg_16x9_3840x2160.jpg",
//   "example_name_s02_e05_eng_bg_16x9_1920x1080.jpg"
// ]
```

Use `neb_cli.mjs` when the other app is not JavaScript, or when the easiest bridge is a local command:

```bash
node neb_cli.mjs neb Movie \
  --title "Friends and Heroes" \
  --language Spanish \
  --resolution hd \
  --house LAS1234567
```

The CLI returns JSON by default:

```json
{
  "ok": true,
  "result": {
    "domain": "neb",
    "task": "Movie",
    "filename": "friends_and_heroes_feature_las_hd_LAS1234567_las.mov",
    "companionCaptions": null,
    "externalReference": "FrndsAndHrs",
    "warnings": []
  }
}
```

For simple scripts, add `--plain`:

```bash
node neb_cli.mjs art Episode \
  --mode set \
  --title "Example Name" \
  --season 02 \
  --episode 05 \
  --language English \
  --plain
```

## Public Functions

Use these functions for new integrations:

- `buildNebOutputs(task, fields)`: returns the MOV/caption output bundle for Movies and Captions.
- `buildArtOutputs(task, fields, { mode })`: returns one art filename or the full required art set.
- `buildNebFilename(task, fields)`: returns one NEB video/caption/audio filename.
- `buildArtFilename(task, fields)`: returns one art filename.
- `buildRequiredArtEntries(task, fields)`: returns required art entries with filenames and requirement tags.
- `listTasks(domain)`: returns supported tasks for `neb` or `art`.
- `getTaskFields(domain, task, { mode })`: returns required input field names for a task.
- `validateTaskFields(domain, task, fields, { mode })`: returns `{ ok, result }` or `{ ok, error }`.

## CLI Reference

```bash
node neb_cli.mjs <neb|art> <task> [--mode single|set] [--fields path.json] [--json '{...}'] [--plain] [--key value ...]
```

Examples:

```bash
node neb_cli.mjs list neb
node neb_cli.mjs list art
node neb_cli.mjs fields art Episode --mode set
node neb_cli.mjs neb "Episode Caption" --fields episode-fields.json
node neb_cli.mjs art Movie --json '{"title":"Example","language":"English","art_tag":"ca","aspect_ratio":"16x9","dimensions":"3840x2160"}'
```

## Versioning

Do not overwrite an existing shipped ZIP. For each public release:

1. Keep the previous `downloads/Name Everything Better V1_xx.zip` in place.
2. Create a new build script and build artifact with the next version number.
3. Add the new ZIP under `downloads/`.
4. Update `index.html` to point at the new ZIP and bump the `site_logic.mjs` cache query.
5. Commit and push the source, docs, website files, and new ZIP together.
