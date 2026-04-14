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
"$PYINSTALLER_BIN" --noconfirm --windowed --name "Verso - Art Naming Tool V1_14" --icon "$ROOT_DIR/assets/verso_art_naming_tool_v1_5_icon.png" --hidden-import tkinter art_name_helper.py
echo "Build complete: $ROOT_DIR/dist/Verso - Art Naming Tool V1_14.app"
