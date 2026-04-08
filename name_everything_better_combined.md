# Name Everything Better V1_20 (macOS)

This combined version adds a first-step choice between Neb movie/caption naming and Verso art naming.

## First Question

`Hi, I'm Neb. Are you naming Movies and Captions or Art?`

Choices:

- `Movies and Captions` -> opens the standard Neb workflow
- `Art` -> opens the Verso art naming workflow

## Build

```bash
./build_name_everything_better_v1_20.sh
```

Output:

- `dist/Name Everything Better V1_20.app`

## Notes

- The combined app keeps Neb and Verso as separate flows behind one launcher.
- Using `Back` inside either flow returns to the top-level chooser in this combined build.
- Standalone Neb and standalone Verso builds remain unchanged.
