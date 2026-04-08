"""Single-item desktop helper for art filename generation."""

from __future__ import annotations

import tkinter as tk
from tkinter import messagebox, ttk

from art_name_helper import (
    APP_TITLE,
    ASPECT_RATIO_OPTIONS,
    DEFAULT_VALUES,
    DIMENSION_OPTIONS,
    EXTRA_USAGE_OPTIONS,
    FIELD_ART_TAG,
    FIELD_ASPECT_RATIO,
    FIELD_DIMENSIONS,
    FIELD_EPISODE,
    FIELD_EXTRA_USAGE,
    FIELD_INTERVIEWEES,
    FIELD_LANGUAGE,
    FIELD_LABELS,
    FIELD_SEASON,
    FIELD_TITLE,
    FIELD_YEAR,
    LANGUAGE_OPTIONS,
    TASKS,
    WINDOW_HEIGHT,
    WINDOW_WIDTH,
    allowed_art_tag_labels,
    allowed_aspect_ratios,
    allowed_dimensions,
    build_filename,
    plus_warning_needed,
    PLUS_WARNING_MESSAGE,
    TASK_FIELD_LABEL_OVERRIDES,
)


class SingleArtNameHelperApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title(APP_TITLE)
        self.root.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT - 120}")
        self.root.minsize(900, 560)

        self.task_var = tk.StringVar(value=next(iter(TASKS.keys())))
        self.status_var = tk.StringVar(value="Fill required fields and click Generate Filename.")
        self.output_var = tk.StringVar(value="")

        self.field_vars = {field: tk.StringVar(value=default) for field, default in DEFAULT_VALUES.items()}
        self.field_rows: dict[str, ttk.Frame] = {}
        self.field_labels: dict[str, ttk.Label] = {}
        self.field_combos: dict[str, ttk.Combobox] = {}

        self._build_ui()
        self._bind_field_logic()
        self._refresh_task_ui()

    def _build_ui(self) -> None:
        main = ttk.Frame(self.root, padding=16)
        main.pack(fill="both", expand=True)

        intro = ttk.Label(
            main,
            text="Hi, I'm Verso. Let's name one piece of art.",
            font=("", 13, "bold"),
            wraplength=760,
            justify="left",
        )
        intro.pack(anchor="w", pady=(0, 14))

        task_row = ttk.Frame(main)
        task_row.pack(fill="x", pady=(0, 10))
        ttk.Label(task_row, text="This art is for :", width=18).pack(side="left")
        task_combo = ttk.Combobox(
            task_row,
            textvariable=self.task_var,
            values=tuple(TASKS.keys()),
            state="readonly",
        )
        task_combo.pack(side="left", fill="x", expand=True)
        task_combo.bind("<<ComboboxSelected>>", lambda _event: self._refresh_task_ui())

        self.fields_frame = ttk.LabelFrame(main, text="Required Fields")
        self.fields_frame.pack(fill="x")
        self._build_field_rows()

        button_row = ttk.Frame(main)
        button_row.pack(fill="x", pady=(10, 6))
        ttk.Button(button_row, text="Generate Filename", command=self._generate).pack(side="right")
        ttk.Button(button_row, text="Clear", command=self._clear_fields).pack(side="right", padx=(0, 8))

        output_frame = ttk.LabelFrame(main, text="Filename")
        output_frame.pack(fill="x")
        output_frame.columnconfigure(0, weight=1)
        ttk.Entry(output_frame, textvariable=self.output_var, state="readonly").grid(
            row=0, column=0, sticky="ew", padx=(10, 8), pady=10
        )
        ttk.Button(output_frame, text="Copy", command=self._copy_filename).grid(
            row=0, column=1, sticky="e", padx=(0, 10), pady=10
        )

        ttk.Label(main, textvariable=self.status_var).pack(anchor="w", pady=(8, 0))

    def _build_field_rows(self) -> None:
        self.field_rows[FIELD_TITLE] = self._add_entry_row(FIELD_TITLE, width=42)
        self.field_rows[FIELD_LANGUAGE] = self._add_combo_row(FIELD_LANGUAGE, LANGUAGE_OPTIONS)
        self.field_rows[FIELD_SEASON] = self._add_entry_row(FIELD_SEASON, width=12)
        self.field_rows[FIELD_EPISODE] = self._add_entry_row(FIELD_EPISODE, width=12)
        self.field_rows[FIELD_YEAR] = self._add_entry_row(FIELD_YEAR, width=12)
        self.field_rows[FIELD_INTERVIEWEES] = self._add_entry_row(FIELD_INTERVIEWEES, width=42)
        self.field_rows[FIELD_EXTRA_USAGE] = self._add_combo_row(FIELD_EXTRA_USAGE, EXTRA_USAGE_OPTIONS)
        self.field_rows[FIELD_ART_TAG] = self._add_combo_row(FIELD_ART_TAG, ("ca - Cover Art", "bg - Background Art", "tt - Title Treatment"))
        self.field_rows[FIELD_ASPECT_RATIO] = self._add_combo_row(FIELD_ASPECT_RATIO, ASPECT_RATIO_OPTIONS)
        self.field_rows[FIELD_DIMENSIONS] = self._add_combo_row(FIELD_DIMENSIONS, DIMENSION_OPTIONS)

    def _add_entry_row(self, field_name: str, width: int = 40) -> ttk.Frame:
        row = ttk.Frame(self.fields_frame)
        label_widget = ttk.Label(row, text=FIELD_LABELS[field_name], width=18)
        label_widget.pack(side="left")
        self.field_labels[field_name] = label_widget
        ttk.Entry(row, textvariable=self.field_vars[field_name], width=width).pack(side="left", fill="x", expand=True)
        return row

    def _add_combo_row(self, field_name: str, values: tuple[str, ...]) -> ttk.Frame:
        row = ttk.Frame(self.fields_frame)
        label_widget = ttk.Label(row, text=FIELD_LABELS[field_name], width=18)
        label_widget.pack(side="left")
        self.field_labels[field_name] = label_widget
        combo = ttk.Combobox(row, textvariable=self.field_vars[field_name], values=values, state="readonly", width=30)
        combo.pack(side="left")
        self.field_combos[field_name] = combo
        return row

    def _bind_field_logic(self) -> None:
        self.field_vars[FIELD_ART_TAG].trace_add("write", self._on_size_driver_change)
        self.field_vars[FIELD_ASPECT_RATIO].trace_add("write", self._on_size_driver_change)

    def _on_size_driver_change(self, *_args: object) -> None:
        self._refresh_size_dropdowns()

    def _refresh_art_tag_dropdown(self) -> None:
        combo = self.field_combos[FIELD_ART_TAG]
        valid_labels = allowed_art_tag_labels(self.task_var.get())
        combo["values"] = valid_labels
        if self.field_vars[FIELD_ART_TAG].get() not in valid_labels:
            self.field_vars[FIELD_ART_TAG].set(valid_labels[0])

    def _refresh_size_dropdowns(self) -> None:
        art_tag_label = self.field_vars[FIELD_ART_TAG].get().strip()
        art_tag_code = art_tag_label.split(" ", 1)[0] if art_tag_label else ""
        aspect_combo = self.field_combos[FIELD_ASPECT_RATIO]
        dimension_combo = self.field_combos[FIELD_DIMENSIONS]
        if not art_tag_code:
            return

        valid_aspects = allowed_aspect_ratios(art_tag_code)
        aspect_combo["values"] = valid_aspects
        if self.field_vars[FIELD_ASPECT_RATIO].get() not in valid_aspects:
            self.field_vars[FIELD_ASPECT_RATIO].set(valid_aspects[0])

        valid_dimensions = allowed_dimensions(self.field_vars[FIELD_ASPECT_RATIO].get())
        dimension_combo["values"] = valid_dimensions
        if self.field_vars[FIELD_DIMENSIONS].get() not in valid_dimensions:
            self.field_vars[FIELD_DIMENSIONS].set(valid_dimensions[0])

    def _refresh_task_ui(self) -> None:
        task_name = self.task_var.get()
        required_fields = TASKS[task_name]
        for row in self.field_rows.values():
            row.pack_forget()
        self._refresh_field_labels(task_name)
        self._refresh_art_tag_dropdown()
        for field in required_fields:
            self.field_rows[field].pack(fill="x", pady=4)
        self._refresh_size_dropdowns()
        self.output_var.set("")

    def _refresh_field_labels(self, task_name: str) -> None:
        overrides = TASK_FIELD_LABEL_OVERRIDES.get(task_name, {})
        for field_name, label_widget in self.field_labels.items():
            label_widget.config(text=overrides.get(field_name, FIELD_LABELS[field_name]))

    def _raw_fields_for_task(self) -> dict[str, str]:
        fields = TASKS[self.task_var.get()]
        return {field: self.field_vars[field].get().strip() for field in fields}

    def _generate(self) -> None:
        raw_fields = self._raw_fields_for_task()
        try:
            filename = build_filename(self.task_var.get(), raw_fields)
        except ValueError as error:
            self.output_var.set("")
            self.status_var.set(str(error))
            return
        self.output_var.set(filename)
        if plus_warning_needed(raw_fields):
            self.status_var.set(f'Filename generated. {PLUS_WARNING_MESSAGE}')
        else:
            self.status_var.set("Filename generated.")

    def _copy_filename(self) -> None:
        value = self.output_var.get().strip()
        if not value:
            messagebox.showwarning(APP_TITLE, "No filename to copy.")
            return
        self.root.clipboard_clear()
        self.root.clipboard_append(value)
        self.status_var.set("Copied filename.")

    def _clear_fields(self) -> None:
        for field, variable in self.field_vars.items():
            variable.set(DEFAULT_VALUES[field])
        self._refresh_task_ui()
        self.status_var.set("Fields cleared.")


def main() -> None:
    root = tk.Tk()
    SingleArtNameHelperApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
