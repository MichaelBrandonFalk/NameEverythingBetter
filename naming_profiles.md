# Naming Convention Profiles

Profiles apply to Movies and Captions and Art in the website and the V2 desktop apps. NEB Standard keeps the established naming rules. Older V1 desktop apps and NEB + PathMaker retain their existing rules.

## Create a profile

1. Open Advanced Settings.
2. Choose Make Editable Copy.
3. Give the profile a name, such as Studio Delivery or Syndication.
4. Adjust the title rules, language codes, caption defaults or house number rules.
5. Select a type to edit its fields and filename recipes.
6. Choose Preview Example to check the result, then Save Profile.

The saved profile becomes active. The Naming Convention Profile menu switches between profiles. NEB Standard is protected and always available.

## Types and recipes

Add Video Type or Add Art Type starts with a copy of an existing type. Give it a unique name and edit its required fields and recipes. Recipes have an English and a Spanish version. Blank caption recipes omit that caption output.

Example video recipe:

```text
{title}_{language}_{house}.mp4
```

Example episode art recipe:

```text
{title}_{season}_{episode}_{language}_{art_tag}_{aspect_ratio}_{dimensions}.{extension}
```

Tokens available include title, language, season, episode, year, house, resolution, interviewees, extra, caption_type, art_tag, aspect_ratio, dimensions, extension and external_reference. Season and episode become s02 and e05. House numbers retain capital letters. Art extension is png for tt and jpg for other tags; a recipe can specify its own extension directly.

Custom fields become recipe tokens. Add a text field:

```text
campaign | Campaign Name | text
```

Add a dropdown field:

```text
channel | Channel | select | web, broadcast
```

Then include {campaign} or {channel} in the recipe. Every listed field is required. Removing a field also requires removing its token from recipes. Each profile keeps at least one video and one art type.

## Art sizes

Allowed Art Sizes controls the choices offered for a single filename. Required Art Variants controls the full set. These lists can be edited separately. Every required variant must also appear in allowed sizes.

```text
bg | 16x9 | 3840x2160
```

A required variant can have delivery tags:

```text
bg | 16x9 | 3840x2160 | Axinom, syndication
```

Required variants are explicit: the app generates the rows saved in the profile, preserving their tags in the CSV. The copied standard Episode profile includes both 3840x2160 and 1920x1080.

## Saving and sharing

Profiles save locally on the current device. Website profiles belong to the browser and website origin where they were saved. Desktop profiles belong to that app's local storage. They do not automatically sync between browsers, devices or desktop apps.

Export Profile downloads a JSON file. Import Profile adds a copy and selects it. Use export/import to share a team profile or move one from the website to a desktop app. Import never replaces an existing saved profile. Clearing browser or app data removes saved profiles, so keep an exported backup.

Changes in Advanced Settings apply when Save Profile is clicked. Changing profiles or reloading discards an unsaved draft.
