"""Combined launcher for Neb movie/caption naming and Verso art naming."""

from __future__ import annotations

import tkinter as tk
from tkinter import ttk

from axinom_name_builder import NebFilenameAssistant
from art_name_helper import ArtNameHelperApp

APP_TITLE = "Name Everything Better"
WINDOW_WIDTH = 940
WINDOW_HEIGHT = 720


class NameEverythingBetterLauncher:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title(APP_TITLE)
        self.root.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}")
        self.root.minsize(900, 640)

        self.main = ttk.Frame(self.root, padding=16)
        self.main.pack(fill="both", expand=True)

        self._build_ui()

    def _build_ui(self) -> None:
        prompt = ttk.Label(
            self.main,
            text="Hi, I'm Neb. Are you naming Movies and Captions or Art?",
            font=("", 13, "bold"),
            wraplength=760,
            justify="center",
        )
        prompt.pack(pady=(160, 20))

        button_row = ttk.Frame(self.main)
        button_row.pack()
        ttk.Button(
            button_row,
            text="Movies and Captions",
            command=self._open_neb,
            width=24,
        ).pack(side="left", padx=8)
        ttk.Button(
            button_row,
            text="Art",
            command=self._open_verso,
            width=18,
        ).pack(side="left", padx=8)

    def _show_launcher(self) -> None:
        self.root.title(APP_TITLE)
        self.main.pack(fill="both", expand=True)

    def _open_neb(self) -> None:
        self.main.pack_forget()
        NebFilenameAssistant(self.root, home_callback=self._show_launcher)
        self.root.title(APP_TITLE)

    def _open_verso(self) -> None:
        self.main.pack_forget()
        ArtNameHelperApp(self.root, home_callback=self._show_launcher)
        self.root.title(APP_TITLE)


def main() -> None:
    root = tk.Tk()
    NameEverythingBetterLauncher(root)
    root.mainloop()


if __name__ == "__main__":
    main()
