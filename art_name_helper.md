# Verso - Art Naming Tool V1_16 (macOS)

Updated the art naming flow so the default path generates the full required art name set for a title, while still keeping a one-at-a-time option.

## Full Required Art Set

- The main Verso flow now generates all required art names for the selected media type.
- It uses only the highest resolution for each required art-tag and aspect-ratio combination.
- The generated list is easy to copy and can be downloaded as a spreadsheet.

## Slug Behavior

- `God's not Dead` -> `gods_not_dead`
- `We're the Messengers` -> `were_the_messengers`
- Accents are still stripped to plain letters.
- Spaces still become underscores.

## Media Types

- `Movie`
- `Series`
- `Season Placeholder`
- `Episode`
- `Original Premium Series (Yearly)`
- `Exclusive Conversation (Yearly)`
- `Virtual Screening`
- `Virtual Screening Episode`
- `Trailer`
- `Extras`
- `Podcast Episodes`
- `Familia Mini-Novelas Series`
- `Familia Mini-Novelas Episodes`

## Axinom-Only Product Types

- `Podcast Episodes` uses the episode filename format and adds `bg 1x1 3000x3000` to regular episode art, with the full set tagged Axinom only.
- `Familia Mini-Novelas Series` uses the series filename format and adds `ca 9x16 2160x3840` and `bg 9x16 2160x3840` to standard series art, with the full set tagged Axinom only.
- `Familia Mini-Novelas Episodes` uses the episode filename format and adds `bg 9x16 1080x1920` to regular episode art, with the full set tagged Axinom only.
- Both Familia Mini-Novelas types default the language field to Spanish.

## Series Title Rule

- For `Season Placeholder`, the `Title` input should be the series title.
- For `Episode`, the `Title` input should be the series title.
- For `Podcast Episodes` and `Familia Mini-Novelas Episodes`, the `Title` input should be the series title.

## Art Types

- `ca` = Cover Art
- `bg` = Background Art
- `tt` = Title Treatment
