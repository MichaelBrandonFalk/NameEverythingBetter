# Name Everything Better V1_25 (macOS)

This version tightens title slugging so punctuation and symbols condense into cleaner Axinom-style filenames.

## Run Locally

```bash
python3 axinom_name_builder.py
```

## Build a macOS `.app`

```bash
./build_name_everything_better_v1_25.sh
```

Output:

- `dist/Name Everything Better V1_25.app`

## Slug Examples

- `Bob's Uncle's Movie` -> `bobs_uncles_movie`
- `Airplane!` -> `airplane`
- `Tora! Tora! Tora!` -> `tora_tora_tora`
- `Godzilla vs. Kong` -> `godzilla_vs_kong`
- `Mr. & Mrs. Smith` -> `mr_and_mrs_smith`
- `Watch on GFAM+` -> `watch_on_gfam_plus`
- `Romeo + Juliet` -> `romeo_and_juliet`
- `WALL·E` -> `walle`
- `M*A*S*H` -> `mash`

## Notes

- `@` condenses to `at`
- `&` condenses to `and`
- standalone `+` condenses to `and`
- attached `+` condenses to `plus`
- punctuation like apostrophes, exclamation marks, dots, middots, and asterisks is stripped cleanly
- For `Episode` and `Episode Caption`, the `Title` input should be the series title.
- For `Virtual Screening Episode` and `Virtual Screening Episode Caption`, the `Title` input should be the series title.
- In the single-item Neb flow, supported video tasks now show the MOV name plus English and Spanish caption names together.
- In the bulk Neb flow, supported video tasks now generate `mov_filename`, `english_caption_filename`, and `spanish_caption_filename` in the output CSV.
