# Publishing To GitHub

This folder is prepared for a public GitHub repository and GitHub Pages site.

## What To Publish

Keep the public repo focused on:

- `index.html`
- `downloads/`
- the current source files for the shipped tools
- the naming convention documents

Do not publish the full local build history in `dist/`, `build/`, or unrelated experimental artifacts.

## Recommended Repo Name

`name-everything-better`

## Suggested First Push

```bash
cd /Users/brandon.falk/ai-test-project

git init
git checkout -b main
git add \
  index.html \
  downloads \
  axinom_name_builder.py \
  axinom_name_builder.md \
  art_name_helper.py \
  art_name_helper.md \
  art_name_helper_single.py \
  name_everything_better_combined.py \
  name_everything_better_combined.md \
  "New Art Naming Conventions.docx" \
  new_art_naming_conventions.md \
  PUBLISHING_TO_GITHUB.md \
  .gitignore
git commit -m "Publish naming tools and documentation"
git remote add origin <YOUR_PUBLIC_GITHUB_REPO_URL>
git push -u origin main
```

## GitHub Pages

After the repo is pushed:

1. Open the repository on GitHub.
2. Go to `Settings`.
3. Open `Pages`.
4. Set Source to `Deploy from a branch`.
5. Choose branch `main`.
6. Choose folder `/ (root)`.
7. Save.

GitHub will then publish `index.html` as the public landing page.

## Current Public Artifacts

- `downloads/Name Everything Better V1_28.zip`
- `downloads/Verso - Art Naming Tool V1_14.zip`
- `downloads/Verso - Art Naming Tool - Single V1_5.zip`
- `downloads/New Art Naming Conventions.docx`
