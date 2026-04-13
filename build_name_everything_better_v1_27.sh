#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCAL_PYINSTALLER="$ROOT_DIR/s3_copy_desktop_app/.venv/bin/pyinstaller"
if [[ -x "$LOCAL_PYINSTALLER" ]]; then
  PYINSTALLER_BIN="$LOCAL_PYINSTALLER"
elif command -v pyinstaller >/dev/null 2>&1; then
  PYINSTALLER_BIN="$(command -v pyinstaller)"
else
  echo "PyInstaller not found."
  exit 1
fi
cd "$ROOT_DIR"
"$PYINSTALLER_BIN" --noconfirm --windowed --name "Name Everything Better V1_27" --icon "$ROOT_DIR/assets/vod_name_builder_v1_7_icon.png" --hidden-import tkinter name_everything_better_combined.py
echo "Build complete: $ROOT_DIR/dist/Name Everything Better V1_27.app"
