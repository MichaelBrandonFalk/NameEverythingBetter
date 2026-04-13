# New Art Naming Conventions

Date: April 1, 2026

## Purpose

We are standardizing art names to help streamline how art is associated with titles across deliveries, libraries, and internal workflows.

A consistent naming structure makes it easier to:

- match art to the correct title quickly
- review and organize assets with less manual sorting
- reduce renaming during handoff
- improve consistency across teams and vendors

The goal is simple: cleaner file names, faster association, and fewer avoidable fixes later.

## Standard Building Blocks

Every art filename is built from a predictable set of pieces:

- title or series name
- season and episode, when applicable
- any fixed token required by the media type
- art tag
- aspect ratio
- dimensions
- file extension

All parts are joined with underscores.

For season and episode-based art, the starting title value should be the series title, not a season name or episode title.

## Art Types

These are the three art types currently used in the standard:

| Tag | Name | File Type | Notes |
| --- | --- | --- | --- |
| `ca` | Cover Art | `.jpg` | Key art, posters, and primary visual packaging |
| `bg` | Background Art | `.jpg` | Background-style art used across title, season, and episode placements |
| `tt` | Title Treatment | `.png` | Always saved as PNG |

## Allowed Art Tags By Media Type

| Media Type | Allowed Art Tags |
| --- | --- |
| Movie | `ca`, `bg`, `tt` |
| Series | `ca`, `bg`, `tt` |
| Season Placeholder | `ca`, `bg` |
| Episode | `bg` |
| Original Premium Series (Yearly) | `bg` |
| Exclusive Conversation (Yearly) | `bg` |
| Virtual Screening | `bg` |
| Virtual Screening Episode | `bg` |
| Trailer | `bg` |
| Extras | `bg` |
| Carousel | `ca` |

## General Formatting Rules

- Use lowercase only.
- Replace spaces with underscores.
- Remove apostrophes instead of turning them into extra separators.
- Strip accents to plain letters so the word stays intact.
- Use aspect ratios in `x` format, such as `16x9`.
- Use dimensions in `widthxheight` format, such as `1920x1080`.
- Use two digits for season and episode numbers, such as `s02` and `e05`.
- Use a four-digit year for yearly formats, such as `2026`.
- Language rule:
  English adds `_eng` immediately before the art tag. Spanish adds `_las` immediately before the art tag.

## Symbol Handling Rules

- Spaces become underscores.
- Apostrophes are removed.
- `&` becomes `and`.
- `@` becomes `at`.
- A standalone `+` becomes `and`.
- An attached `+` becomes `plus`.
- `!`, `.`, `·`, and `*` are removed.

## Name Cleanup Examples

| Entered Value | Final Filename Value |
| --- | --- |
| `God's not Dead` | `gods_not_dead` |
| `José María` | `jose_maria` |
| `We're the Messengers` | `were_the_messengers` |
| `Anthony Hopkins` | `anthony_hopkins` |
| `Mr. & Mrs. Smith` | `mr_and_mrs_smith` |
| `Watch on GFAM+` | `watch_on_gfam_plus` |
| `Romeo + Juliet` | `romeo_and_juliet` |
| `WALL·E` | `walle` |
| `M*A*S*H` | `mash` |

## Media Types And Filename Recipes

### Movie

Formula:

`[title]_[language]_[art_tag]_[aspect_ratio]_[dimensions].[extension]`

Required fields:

- Title
- Language
- Art Tag
- Aspect Ratio
- Dimensions

Example:

`county_rescue_eng_ca_16x9_3840x2160.jpg`

English example:

`strong_fathers_strong_daughters_eng_bg_16x9_1920x1080.jpg`

Spanish example:

`strong_fathers_strong_daughters_las_bg_16x9_1920x1080.jpg`

### Series

Formula:

`[title]_[language]_[art_tag]_[aspect_ratio]_[dimensions].[extension]`

Required fields:

- Title
- Language
- Art Tag
- Aspect Ratio
- Dimensions

Example:

`county_rescue_eng_bg_16x9_1920x1080.jpg`

### Season Placeholder

Formula:

`[series_name]_s[xx]_[language]_[art_tag]_[aspect_ratio]_[dimensions].[extension]`

Required fields:

- Series Name
- Season
- Language
- Art Tag
- Aspect Ratio
- Dimensions

Example:

`county_rescue_s02_eng_ca_16x9_1920x1080.jpg`

### Episode

Formula:

`[series_name]_s[xx]_e[xx]_[language]_[art_tag]_[aspect_ratio]_[dimensions].[extension]`

Required fields:

- Series Name
- Season
- Episode
- Language
- Art Tag
- Aspect Ratio
- Dimensions

Examples:

`county_rescue_s02_e06_eng_bg_16x9_1920x1080.jpg`

`county_rescue_s02_e06_eng_bg_7x3_2450x1100.jpg`

### Original Premium Series (Yearly)

Formula:

`[title]_s[yyyy]_e[xx]_[language]_[art_tag]_[aspect_ratio]_[dimensions].[extension]`

Required fields:

- Title
- Year
- Episode
- Language
- Art Tag
- Aspect Ratio
- Dimensions

Example:

`pure_devotions_s2025_e01_eng_bg_16x9_1920x1080.jpg`

### Exclusive Conversation (Yearly)

Formula:

`exclusive_conversations_s[yyyy]_e[xx]_[interviewees]_[language]_[art_tag]_[aspect_ratio]_[dimensions].[extension]`

Required fields:

- Year
- Episode
- Interviewee(s)
- Language
- Art Tag
- Aspect Ratio
- Dimensions

Notes:

- `exclusive_conversations` is a fixed starting token.
- The interviewee value is inserted after the episode token.

Example:

`exclusive_conversations_s2026_e09_anthony_hopkins_eng_bg_16x9_1920x1080.jpg`

### Virtual Screening

Formula:

`[title]_virtual_screening_[language]_[art_tag]_[aspect_ratio]_[dimensions].[extension]`

Required fields:

- Title
- Language
- Art Tag
- Aspect Ratio
- Dimensions

Example:

`wild_like_me_virtual_screening_eng_bg_16x9_1920x1080.jpg`

### Virtual Screening Episode

Formula:

`[series_name]_s[xx]_e[xx]_virtual_screening_[language]_[art_tag]_[aspect_ratio]_[dimensions].[extension]`

Required fields:

- Series Name
- Season
- Episode
- Language
- Art Tag
- Aspect Ratio
- Dimensions

Example:

`when_hope_calls_s03_e02_virtual_screening_eng_bg_16x9_1920x1080.jpg`

### Trailer

Formula:

`[title]_trailer_[language]_[art_tag]_[aspect_ratio]_[dimensions].[extension]`

Required fields:

- Title
- Language
- Art Tag
- Aspect Ratio
- Dimensions

Example:

`gods_not_dead_trailer_eng_bg_16x9_1920x1080.jpg`

### Extras

Formula:

`[title]_[extra_prefix]_[language]_[art_tag]_[aspect_ratio]_[dimensions].[extension]`

Required fields:

- Title
- Language
- Extra Type
- Art Tag
- Aspect Ratio
- Dimensions

Example:

`gods_not_dead_del_eng_bg_16x9_1920x1080.jpg`

### Carousel

Formula:

`[title]_carousel_[language]_[art_tag]_[aspect_ratio]_[dimensions].[extension]`

Required fields:

- Title
- Language
- Art Tag
- Aspect Ratio
- Dimensions

Example:

`county_rescue_carousel_eng_ca_7x3_2450x1100.jpg`

## Extras Prefixes

| Extra Type | Filename Prefix |
| --- | --- |
| Behind the Scenes / Making Of | `bts` |
| Interviews (Cast/Crew) | `int` |
| Deleted Scenes | `del` |
| Bloopers / Alternate Takes | `alt` |
| Music Videos | `mus` |
| Promotional Clips | `clp` |

## Approved Art Sizes

Use one of the approved aspect ratio and dimensions combinations below.

The aspect ratio determines which pixel sizes are allowed. Not every dimension is valid for every ratio.

### Approved Pixel Sizes By Aspect Ratio

| Aspect Ratio | Approved Pixel Sizes |
| --- | --- |
| `7x3` | `2450x1100` |
| `16x9` | `3840x2160`, `2560x1440`, `1920x1080` |
| `4x3` | `3200x2400`, `2560x1920`, `1440x1080` |
| `3x4` | `2400x3200`, `1920x2560` |
| `2x3` | `2000x3000`, `1600x2400` |
| `1x1` | `3000x3000` |
| `9x5` | `1800x1000` |

These are the approved pixel sizes the app should present after an aspect ratio is selected.

## Quick Reference By Media Type

| Media Type | Required Fields |
| --- | --- |
| Movie | `title`, `language`, `art_tag`, `aspect_ratio`, `dimensions` |
| Series | `title`, `language`, `art_tag`, `aspect_ratio`, `dimensions` |
| Season Placeholder | `title`, `season`, `language`, `art_tag`, `aspect_ratio`, `dimensions` |
| Episode | `title`, `season`, `episode`, `language`, `art_tag`, `aspect_ratio`, `dimensions` |
| Original Premium Series (Yearly) | `title`, `year`, `episode`, `language`, `art_tag`, `aspect_ratio`, `dimensions` |
| Exclusive Conversation (Yearly) | `year`, `episode`, `interviewees`, `language`, `art_tag`, `aspect_ratio`, `dimensions` |
| Virtual Screening | `title`, `language`, `art_tag`, `aspect_ratio`, `dimensions` |
| Virtual Screening Episode | `title`, `season`, `episode`, `language`, `art_tag`, `aspect_ratio`, `dimensions` |
| Trailer | `title`, `language`, `art_tag`, `aspect_ratio`, `dimensions` |
| Extras | `title`, `language`, `extra_usage`, `art_tag`, `aspect_ratio`, `dimensions` |
| Carousel | `title`, `language`, `art_tag`, `aspect_ratio`, `dimensions` |

## Workflow

1. Start with the correct media type.
2. Enter the title or series value using the standard cleanup rules.
3. Add season, episode, year, interviewee, or extra prefix only when that media type requires it.
4. Choose the correct art tag.
5. Choose an approved aspect ratio and matching dimensions.
6. Save the file with the extension that belongs to that art tag.

## Adoption Note

This naming standard is meant to make art easier to place, easier to review, and easier to trace back to the right title. The more consistently it is used, the less time gets spent on cleanup later in the process.

## Example Matrix
The tables below use one fixed sample title so every allowed filename variation can be reviewed side by side.
- Title / Series Name: `be_like_water`
- Season sample: `s01`
- Episode sample: `e01`
- Languages shown: `eng`, `las`
### Movie Combinations
| Title | Language | Art Tag | Aspect Ratio | Dimensions | Example Filename |
| --- | --- | --- | --- | --- | --- |
| be_like_water | eng | ca | 7x3 | 2450x1100 | be_like_water_eng_ca_7x3_2450x1100.jpg |
| be_like_water | las | ca | 7x3 | 2450x1100 | be_like_water_las_ca_7x3_2450x1100.jpg |
| be_like_water | eng | ca | 16x9 | 3840x2160 | be_like_water_eng_ca_16x9_3840x2160.jpg |
| be_like_water | las | ca | 16x9 | 3840x2160 | be_like_water_las_ca_16x9_3840x2160.jpg |
| be_like_water | eng | ca | 16x9 | 1920x1080 | be_like_water_eng_ca_16x9_1920x1080.jpg |
| be_like_water | las | ca | 16x9 | 1920x1080 | be_like_water_las_ca_16x9_1920x1080.jpg |
| be_like_water | eng | ca | 4x3 | 3200x2400 | be_like_water_eng_ca_4x3_3200x2400.jpg |
| be_like_water | las | ca | 4x3 | 3200x2400 | be_like_water_las_ca_4x3_3200x2400.jpg |
| be_like_water | eng | ca | 4x3 | 2560x1920 | be_like_water_eng_ca_4x3_2560x1920.jpg |
| be_like_water | las | ca | 4x3 | 2560x1920 | be_like_water_las_ca_4x3_2560x1920.jpg |
| be_like_water | eng | ca | 3x4 | 2400x3200 | be_like_water_eng_ca_3x4_2400x3200.jpg |
| be_like_water | las | ca | 3x4 | 2400x3200 | be_like_water_las_ca_3x4_2400x3200.jpg |
| be_like_water | eng | ca | 3x4 | 1920x2560 | be_like_water_eng_ca_3x4_1920x2560.jpg |
| be_like_water | las | ca | 3x4 | 1920x2560 | be_like_water_las_ca_3x4_1920x2560.jpg |
| be_like_water | eng | ca | 2x3 | 2000x3000 | be_like_water_eng_ca_2x3_2000x3000.jpg |
| be_like_water | las | ca | 2x3 | 2000x3000 | be_like_water_las_ca_2x3_2000x3000.jpg |
| be_like_water | eng | ca | 2x3 | 1600x2400 | be_like_water_eng_ca_2x3_1600x2400.jpg |
| be_like_water | las | ca | 2x3 | 1600x2400 | be_like_water_las_ca_2x3_1600x2400.jpg |
| be_like_water | eng | ca | 1x1 | 3000x3000 | be_like_water_eng_ca_1x1_3000x3000.jpg |
| be_like_water | las | ca | 1x1 | 3000x3000 | be_like_water_las_ca_1x1_3000x3000.jpg |
| be_like_water | eng | bg | 16x9 | 3840x2160 | be_like_water_eng_bg_16x9_3840x2160.jpg |
| be_like_water | las | bg | 16x9 | 3840x2160 | be_like_water_las_bg_16x9_3840x2160.jpg |
| be_like_water | eng | bg | 16x9 | 2560x1440 | be_like_water_eng_bg_16x9_2560x1440.jpg |
| be_like_water | las | bg | 16x9 | 2560x1440 | be_like_water_las_bg_16x9_2560x1440.jpg |
| be_like_water | eng | bg | 16x9 | 1920x1080 | be_like_water_eng_bg_16x9_1920x1080.jpg |
| be_like_water | las | bg | 16x9 | 1920x1080 | be_like_water_las_bg_16x9_1920x1080.jpg |
| be_like_water | eng | bg | 2x3 | 2000x3000 | be_like_water_eng_bg_2x3_2000x3000.jpg |
| be_like_water | las | bg | 2x3 | 2000x3000 | be_like_water_las_bg_2x3_2000x3000.jpg |
| be_like_water | eng | bg | 7x3 | 2450x1100 | be_like_water_eng_bg_7x3_2450x1100.jpg |
| be_like_water | las | bg | 7x3 | 2450x1100 | be_like_water_las_bg_7x3_2450x1100.jpg |
| be_like_water | eng | bg | 4x3 | 1440x1080 | be_like_water_eng_bg_4x3_1440x1080.jpg |
| be_like_water | las | bg | 4x3 | 1440x1080 | be_like_water_las_bg_4x3_1440x1080.jpg |
| be_like_water | eng | tt | 9x5 | 1800x1000 | be_like_water_eng_tt_9x5_1800x1000.png |
| be_like_water | las | tt | 9x5 | 1800x1000 | be_like_water_las_tt_9x5_1800x1000.png |

### Series Combinations
| Title | Language | Art Tag | Aspect Ratio | Dimensions | Example Filename |
| --- | --- | --- | --- | --- | --- |
| be_like_water | eng | ca | 7x3 | 2450x1100 | be_like_water_eng_ca_7x3_2450x1100.jpg |
| be_like_water | las | ca | 7x3 | 2450x1100 | be_like_water_las_ca_7x3_2450x1100.jpg |
| be_like_water | eng | ca | 16x9 | 3840x2160 | be_like_water_eng_ca_16x9_3840x2160.jpg |
| be_like_water | las | ca | 16x9 | 3840x2160 | be_like_water_las_ca_16x9_3840x2160.jpg |
| be_like_water | eng | ca | 16x9 | 1920x1080 | be_like_water_eng_ca_16x9_1920x1080.jpg |
| be_like_water | las | ca | 16x9 | 1920x1080 | be_like_water_las_ca_16x9_1920x1080.jpg |
| be_like_water | eng | ca | 4x3 | 3200x2400 | be_like_water_eng_ca_4x3_3200x2400.jpg |
| be_like_water | las | ca | 4x3 | 3200x2400 | be_like_water_las_ca_4x3_3200x2400.jpg |
| be_like_water | eng | ca | 4x3 | 2560x1920 | be_like_water_eng_ca_4x3_2560x1920.jpg |
| be_like_water | las | ca | 4x3 | 2560x1920 | be_like_water_las_ca_4x3_2560x1920.jpg |
| be_like_water | eng | ca | 3x4 | 2400x3200 | be_like_water_eng_ca_3x4_2400x3200.jpg |
| be_like_water | las | ca | 3x4 | 2400x3200 | be_like_water_las_ca_3x4_2400x3200.jpg |
| be_like_water | eng | ca | 3x4 | 1920x2560 | be_like_water_eng_ca_3x4_1920x2560.jpg |
| be_like_water | las | ca | 3x4 | 1920x2560 | be_like_water_las_ca_3x4_1920x2560.jpg |
| be_like_water | eng | ca | 2x3 | 2000x3000 | be_like_water_eng_ca_2x3_2000x3000.jpg |
| be_like_water | las | ca | 2x3 | 2000x3000 | be_like_water_las_ca_2x3_2000x3000.jpg |
| be_like_water | eng | ca | 2x3 | 1600x2400 | be_like_water_eng_ca_2x3_1600x2400.jpg |
| be_like_water | las | ca | 2x3 | 1600x2400 | be_like_water_las_ca_2x3_1600x2400.jpg |
| be_like_water | eng | ca | 1x1 | 3000x3000 | be_like_water_eng_ca_1x1_3000x3000.jpg |
| be_like_water | las | ca | 1x1 | 3000x3000 | be_like_water_las_ca_1x1_3000x3000.jpg |
| be_like_water | eng | bg | 16x9 | 3840x2160 | be_like_water_eng_bg_16x9_3840x2160.jpg |
| be_like_water | las | bg | 16x9 | 3840x2160 | be_like_water_las_bg_16x9_3840x2160.jpg |
| be_like_water | eng | bg | 16x9 | 2560x1440 | be_like_water_eng_bg_16x9_2560x1440.jpg |
| be_like_water | las | bg | 16x9 | 2560x1440 | be_like_water_las_bg_16x9_2560x1440.jpg |
| be_like_water | eng | bg | 16x9 | 1920x1080 | be_like_water_eng_bg_16x9_1920x1080.jpg |
| be_like_water | las | bg | 16x9 | 1920x1080 | be_like_water_las_bg_16x9_1920x1080.jpg |
| be_like_water | eng | bg | 2x3 | 2000x3000 | be_like_water_eng_bg_2x3_2000x3000.jpg |
| be_like_water | las | bg | 2x3 | 2000x3000 | be_like_water_las_bg_2x3_2000x3000.jpg |
| be_like_water | eng | bg | 7x3 | 2450x1100 | be_like_water_eng_bg_7x3_2450x1100.jpg |
| be_like_water | las | bg | 7x3 | 2450x1100 | be_like_water_las_bg_7x3_2450x1100.jpg |
| be_like_water | eng | bg | 4x3 | 1440x1080 | be_like_water_eng_bg_4x3_1440x1080.jpg |
| be_like_water | las | bg | 4x3 | 1440x1080 | be_like_water_las_bg_4x3_1440x1080.jpg |
| be_like_water | eng | tt | 9x5 | 1800x1000 | be_like_water_eng_tt_9x5_1800x1000.png |
| be_like_water | las | tt | 9x5 | 1800x1000 | be_like_water_las_tt_9x5_1800x1000.png |

### Season Combinations
| Title | Season | Language | Art Tag | Aspect Ratio | Dimensions | Example Filename |
| --- | --- | --- | --- | --- | --- | --- |
| be_like_water | s01 | eng | ca | 7x3 | 2450x1100 | be_like_water_s01_eng_ca_7x3_2450x1100.jpg |
| be_like_water | s01 | las | ca | 7x3 | 2450x1100 | be_like_water_s01_las_ca_7x3_2450x1100.jpg |
| be_like_water | s01 | eng | ca | 16x9 | 3840x2160 | be_like_water_s01_eng_ca_16x9_3840x2160.jpg |
| be_like_water | s01 | las | ca | 16x9 | 3840x2160 | be_like_water_s01_las_ca_16x9_3840x2160.jpg |
| be_like_water | s01 | eng | ca | 16x9 | 1920x1080 | be_like_water_s01_eng_ca_16x9_1920x1080.jpg |
| be_like_water | s01 | las | ca | 16x9 | 1920x1080 | be_like_water_s01_las_ca_16x9_1920x1080.jpg |
| be_like_water | s01 | eng | ca | 4x3 | 3200x2400 | be_like_water_s01_eng_ca_4x3_3200x2400.jpg |
| be_like_water | s01 | las | ca | 4x3 | 3200x2400 | be_like_water_s01_las_ca_4x3_3200x2400.jpg |
| be_like_water | s01 | eng | ca | 4x3 | 2560x1920 | be_like_water_s01_eng_ca_4x3_2560x1920.jpg |
| be_like_water | s01 | las | ca | 4x3 | 2560x1920 | be_like_water_s01_las_ca_4x3_2560x1920.jpg |
| be_like_water | s01 | eng | ca | 3x4 | 2400x3200 | be_like_water_s01_eng_ca_3x4_2400x3200.jpg |
| be_like_water | s01 | las | ca | 3x4 | 2400x3200 | be_like_water_s01_las_ca_3x4_2400x3200.jpg |
| be_like_water | s01 | eng | ca | 3x4 | 1920x2560 | be_like_water_s01_eng_ca_3x4_1920x2560.jpg |
| be_like_water | s01 | las | ca | 3x4 | 1920x2560 | be_like_water_s01_las_ca_3x4_1920x2560.jpg |
| be_like_water | s01 | eng | ca | 2x3 | 2000x3000 | be_like_water_s01_eng_ca_2x3_2000x3000.jpg |
| be_like_water | s01 | las | ca | 2x3 | 2000x3000 | be_like_water_s01_las_ca_2x3_2000x3000.jpg |
| be_like_water | s01 | eng | ca | 2x3 | 1600x2400 | be_like_water_s01_eng_ca_2x3_1600x2400.jpg |
| be_like_water | s01 | las | ca | 2x3 | 1600x2400 | be_like_water_s01_las_ca_2x3_1600x2400.jpg |
| be_like_water | s01 | eng | ca | 1x1 | 3000x3000 | be_like_water_s01_eng_ca_1x1_3000x3000.jpg |
| be_like_water | s01 | las | ca | 1x1 | 3000x3000 | be_like_water_s01_las_ca_1x1_3000x3000.jpg |
| be_like_water | s01 | eng | bg | 16x9 | 3840x2160 | be_like_water_s01_eng_bg_16x9_3840x2160.jpg |
| be_like_water | s01 | las | bg | 16x9 | 3840x2160 | be_like_water_s01_las_bg_16x9_3840x2160.jpg |
| be_like_water | s01 | eng | bg | 16x9 | 2560x1440 | be_like_water_s01_eng_bg_16x9_2560x1440.jpg |
| be_like_water | s01 | las | bg | 16x9 | 2560x1440 | be_like_water_s01_las_bg_16x9_2560x1440.jpg |
| be_like_water | s01 | eng | bg | 16x9 | 1920x1080 | be_like_water_s01_eng_bg_16x9_1920x1080.jpg |
| be_like_water | s01 | las | bg | 16x9 | 1920x1080 | be_like_water_s01_las_bg_16x9_1920x1080.jpg |
| be_like_water | s01 | eng | bg | 2x3 | 2000x3000 | be_like_water_s01_eng_bg_2x3_2000x3000.jpg |
| be_like_water | s01 | las | bg | 2x3 | 2000x3000 | be_like_water_s01_las_bg_2x3_2000x3000.jpg |
| be_like_water | s01 | eng | bg | 7x3 | 2450x1100 | be_like_water_s01_eng_bg_7x3_2450x1100.jpg |
| be_like_water | s01 | las | bg | 7x3 | 2450x1100 | be_like_water_s01_las_bg_7x3_2450x1100.jpg |
| be_like_water | s01 | eng | bg | 4x3 | 1440x1080 | be_like_water_s01_eng_bg_4x3_1440x1080.jpg |
| be_like_water | s01 | las | bg | 4x3 | 1440x1080 | be_like_water_s01_las_bg_4x3_1440x1080.jpg |

### Episode Combinations
| Title | Season | Episode | Language | Art Tag | Aspect Ratio | Dimensions | Example Filename |
| --- | --- | --- | --- | --- | --- | --- | --- |
| be_like_water | s01 | e01 | eng | bg | 16x9 | 3840x2160 | be_like_water_s01_e01_eng_bg_16x9_3840x2160.jpg |
| be_like_water | s01 | e01 | las | bg | 16x9 | 3840x2160 | be_like_water_s01_e01_las_bg_16x9_3840x2160.jpg |
| be_like_water | s01 | e01 | eng | bg | 16x9 | 2560x1440 | be_like_water_s01_e01_eng_bg_16x9_2560x1440.jpg |
| be_like_water | s01 | e01 | las | bg | 16x9 | 2560x1440 | be_like_water_s01_e01_las_bg_16x9_2560x1440.jpg |
| be_like_water | s01 | e01 | eng | bg | 16x9 | 1920x1080 | be_like_water_s01_e01_eng_bg_16x9_1920x1080.jpg |
| be_like_water | s01 | e01 | las | bg | 16x9 | 1920x1080 | be_like_water_s01_e01_las_bg_16x9_1920x1080.jpg |
| be_like_water | s01 | e01 | eng | bg | 2x3 | 2000x3000 | be_like_water_s01_e01_eng_bg_2x3_2000x3000.jpg |
| be_like_water | s01 | e01 | las | bg | 2x3 | 2000x3000 | be_like_water_s01_e01_las_bg_2x3_2000x3000.jpg |
| be_like_water | s01 | e01 | eng | bg | 7x3 | 2450x1100 | be_like_water_s01_e01_eng_bg_7x3_2450x1100.jpg |
| be_like_water | s01 | e01 | las | bg | 7x3 | 2450x1100 | be_like_water_s01_e01_las_bg_7x3_2450x1100.jpg |
| be_like_water | s01 | e01 | eng | bg | 4x3 | 1440x1080 | be_like_water_s01_e01_eng_bg_4x3_1440x1080.jpg |
| be_like_water | s01 | e01 | las | bg | 4x3 | 1440x1080 | be_like_water_s01_e01_las_bg_4x3_1440x1080.jpg |
