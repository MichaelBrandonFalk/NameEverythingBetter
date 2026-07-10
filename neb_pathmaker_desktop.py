"""Desktop app for NEB+PathMaker."""

from __future__ import annotations

import tkinter as tk
from tkinter import messagebox, ttk

from axinom_name_builder import (
    COMPANION_CAPTION_TASKS,
    DEFAULT_VALUES,
    EXTRA_USAGE_OPTIONS,
    FIELD_EPISODE,
    FIELD_EXTRA_USAGE,
    FIELD_HOUSE,
    FIELD_INTERVIEWEES,
    FIELD_LANGUAGE,
    FIELD_RESOLUTION,
    FIELD_SEASON,
    FIELD_SUBTITLE_TYPE,
    FIELD_TITLE,
    FIELD_YEAR,
    LANGUAGE_OPTIONS,
    PLUS_WARNING_MESSAGE,
    RESOLUTION_OPTIONS,
    SUBTITLE_DEFAULT_BY_LANGUAGE,
    SUBTITLE_TYPE_OPTIONS,
    TASK_FIELD_LABEL_OVERRIDES,
    build_external_reference,
    build_filename,
    plus_warning_needed,
)
from neb_pathmaker_core import (
    FIELD_SKU,
    PATHMAKER_DEFAULTS,
    PATHMAKER_EXTRA_USAGE_TO_PREFIX,
    build_pathmaker_path,
    pathmaker_fields_for_task,
    pathmaker_task_options,
)

APP_TITLE = "NEB+PathMaker"
WINDOW_WIDTH = 980
WINDOW_HEIGHT = 720

FIELD_LABELS = {
    FIELD_TITLE: "Title *",
    FIELD_LANGUAGE: "Language *",
    FIELD_SUBTITLE_TYPE: "Caption Type *",
    FIELD_RESOLUTION: "Resolution *",
    FIELD_HOUSE: "House Number *",
    FIELD_SEASON: "Season *",
    FIELD_EPISODE: "Episode *",
    FIELD_INTERVIEWEES: "Interviewee(s) *",
    FIELD_YEAR: "Year *",
    FIELD_EXTRA_USAGE: "Extra Type *",
    FIELD_SKU: "SKU / Parent SKU *",
}


class NebPathMakerApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title(APP_TITLE)
        self.root.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}")
        self.root.minsize(900, 640)

        self.task_var = tk.StringVar(value="Movie")
        self.field_vars = {
            field: tk.StringVar(value=PATHMAKER_DEFAULTS.get(field, DEFAULT_VALUES.get(field, "")))
            for field in FIELD_LABELS
        }
        self.output_vars = {
            "video": tk.StringVar(value=""),
            "caption_eng": tk.StringVar(value=""),
            "caption_las": tk.StringVar(value=""),
            "external_reference": tk.StringVar(value=""),
            "path": tk.StringVar(value=""),
        }
        self.status_var = tk.StringVar(value="")
        self.field_rows: dict[str, ttk.Frame] = {}
        self.field_labels: dict[str, ttk.Label] = {}
        self.output_rows: dict[str, ttk.Frame] = {}
        self._subtitle_type_manual_override = False
        self._suppress_subtitle_tracking = False

        self._build_ui()
        self._bind_field_logic()
        self._refresh_task_ui()

    def _build_ui(self) -> None:
        main = ttk.Frame(self.root, padding=16)
        main.pack(fill="both", expand=True)

        top_row = ttk.Frame(main)
        top_row.pack(fill="x", pady=(0, 12))
        ttk.Label(top_row, text=APP_TITLE, font=("", 16, "bold")).pack(side="left")

        body = ttk.Frame(main)
        body.pack(fill="both", expand=True)
        body.columnconfigure(0, weight=3)
        body.columnconfigure(1, weight=2)

        input_frame = ttk.LabelFrame(body, text="Inputs")
        input_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 10))
        input_frame.columnconfigure(0, weight=1)

        task_row = ttk.Frame(input_frame)
        task_row.grid(row=0, column=0, sticky="ew", padx=10, pady=(10, 8))
        ttk.Label(task_row, text="What are you making?", width=22).pack(side="left")
        task_combo = ttk.Combobox(task_row, textvariable=self.task_var, values=pathmaker_task_options(), state="readonly")
        task_combo.pack(side="left", fill="x", expand=True)
        task_combo.bind("<<ComboboxSelected>>", lambda _event: self._refresh_task_ui())

        self.fields_frame = ttk.Frame(input_frame)
        self.fields_frame.grid(row=1, column=0, sticky="ew", padx=10, pady=(0, 8))
        self._build_field_rows()

        button_row = ttk.Frame(input_frame)
        button_row.grid(row=2, column=0, sticky="w", padx=10, pady=(4, 10))
        ttk.Button(button_row, text="Generate Name", command=self._generate_name).pack(side="left")
        ttk.Button(button_row, text="PathMaker", command=self._generate_path).pack(side="left", padx=(8, 0))
        ttk.Button(button_row, text="Clear", command=self._clear_fields).pack(side="left", padx=(8, 0))

        output_frame = ttk.LabelFrame(body, text="Generated Outputs")
        output_frame.grid(row=0, column=1, sticky="nsew")
        output_frame.columnconfigure(0, weight=1)
        self.output_rows["video"] = self._add_output_row(output_frame, 0, "MOV Name", self.output_vars["video"])
        self.output_rows["caption_eng"] = self._add_output_row(output_frame, 1, "English Caption", self.output_vars["caption_eng"])
        self.output_rows["caption_las"] = self._add_output_row(output_frame, 2, "Spanish Caption", self.output_vars["caption_las"])
        self.output_rows["external_reference"] = self._add_output_row(
            output_frame, 3, "External Reference", self.output_vars["external_reference"]
        )
        self.output_rows["path"] = self._add_output_row(output_frame, 4, "S3 Path", self.output_vars["path"])
        ttk.Button(output_frame, text="Copy All", command=self._copy_all).grid(row=5, column=1, sticky="e", padx=10, pady=(2, 10))

        ttk.Label(main, textvariable=self.status_var).pack(anchor="w", pady=(10, 0))

    def _build_field_rows(self) -> None:
        self.field_rows[FIELD_TITLE] = self._add_entry_row(FIELD_TITLE)
        self.field_rows[FIELD_LANGUAGE] = self._add_combo_row(FIELD_LANGUAGE, LANGUAGE_OPTIONS)
        self.field_rows[FIELD_SUBTITLE_TYPE] = self._add_combo_row(FIELD_SUBTITLE_TYPE, SUBTITLE_TYPE_OPTIONS)
        self.field_rows[FIELD_RESOLUTION] = self._add_combo_row(FIELD_RESOLUTION, RESOLUTION_OPTIONS)
        self.field_rows[FIELD_HOUSE] = self._add_entry_row(FIELD_HOUSE)
        self.field_rows[FIELD_SEASON] = self._add_entry_row(FIELD_SEASON, width=12)
        self.field_rows[FIELD_EPISODE] = self._add_entry_row(FIELD_EPISODE, width=12)
        self.field_rows[FIELD_INTERVIEWEES] = self._add_entry_row(FIELD_INTERVIEWEES)
        self.field_rows[FIELD_YEAR] = self._add_entry_row(FIELD_YEAR, width=12)
        self.field_rows[FIELD_EXTRA_USAGE] = self._add_combo_row(
            FIELD_EXTRA_USAGE,
            tuple(option for option in EXTRA_USAGE_OPTIONS if option in PATHMAKER_EXTRA_USAGE_TO_PREFIX),
        )
        self.field_rows[FIELD_SKU] = self._add_entry_row(FIELD_SKU)

    def _add_entry_row(self, field: str, width: int = 40) -> ttk.Frame:
        row = ttk.Frame(self.fields_frame)
        label = ttk.Label(row, text=FIELD_LABELS[field], width=22)
        label.pack(side="left")
        ttk.Entry(row, textvariable=self.field_vars[field], width=width).pack(side="left", fill="x", expand=True)
        self.field_labels[field] = label
        return row

    def _add_combo_row(self, field: str, values: tuple[str, ...]) -> ttk.Frame:
        row = ttk.Frame(self.fields_frame)
        label = ttk.Label(row, text=FIELD_LABELS[field], width=22)
        label.pack(side="left")
        ttk.Combobox(row, textvariable=self.field_vars[field], values=values, state="readonly", width=30).pack(side="left")
        self.field_labels[field] = label
        return row

    def _add_output_row(self, parent: ttk.Widget, row_index: int, label: str, variable: tk.StringVar) -> ttk.Frame:
        row = ttk.Frame(parent)
        row.grid(row=row_index, column=0, columnspan=2, sticky="ew", padx=10, pady=(10 if row_index == 0 else 0, 8))
        row.columnconfigure(1, weight=1)
        ttk.Label(row, text=label, width=18).grid(row=0, column=0, sticky="w", padx=(0, 8))
        ttk.Entry(row, textvariable=variable, state="readonly").grid(row=0, column=1, sticky="ew")
        return row

    def _bind_field_logic(self) -> None:
        self.task_var.trace_add("write", self._on_task_change)
        self.field_vars[FIELD_LANGUAGE].trace_add("write", self._on_language_change)
        self.field_vars[FIELD_SUBTITLE_TYPE].trace_add("write", self._on_subtitle_type_change)

    def _task_uses_subtitle_type(self, task: str) -> bool:
        return FIELD_SUBTITLE_TYPE in pathmaker_fields_for_task(task)

    def _default_subtitle_type(self) -> str:
        return SUBTITLE_DEFAULT_BY_LANGUAGE[self.field_vars[FIELD_LANGUAGE].get()]

    def _apply_subtitle_default(self, force: bool = False) -> None:
        if not self._task_uses_subtitle_type(self.task_var.get()):
            return
        if self._subtitle_type_manual_override and not force:
            return
        default_value = self._default_subtitle_type()
        if self.field_vars[FIELD_SUBTITLE_TYPE].get() == default_value:
            return
        self._suppress_subtitle_tracking = True
        self.field_vars[FIELD_SUBTITLE_TYPE].set(default_value)
        self._suppress_subtitle_tracking = False

    def _on_task_change(self, *_args: object) -> None:
        self._subtitle_type_manual_override = False
        self._apply_subtitle_default(force=True)

    def _on_language_change(self, *_args: object) -> None:
        if self.field_vars[FIELD_LANGUAGE].get() == "Spanish":
            self._subtitle_type_manual_override = False
            self._apply_subtitle_default(force=True)
            return
        self._apply_subtitle_default()

    def _on_subtitle_type_change(self, *_args: object) -> None:
        if self._suppress_subtitle_tracking:
            return
        self._subtitle_type_manual_override = True

    def _refresh_task_ui(self) -> None:
        task = self.task_var.get()
        self._subtitle_type_manual_override = False
        self._apply_subtitle_default(force=True)
        for row in self.field_rows.values():
            row.pack_forget()
        overrides = TASK_FIELD_LABEL_OVERRIDES.get(task, {})
        for field in pathmaker_fields_for_task(task):
            self.field_labels[field].config(text=overrides.get(field, FIELD_LABELS[field]))
            self.field_rows[field].pack(fill="x", pady=4)
        self._clear_outputs()
        self._refresh_output_rows()

    def _refresh_output_rows(self) -> None:
        has_companion_captions = self.task_var.get() in COMPANION_CAPTION_TASKS
        if has_companion_captions:
            self.output_rows["caption_eng"].grid()
            self.output_rows["caption_las"].grid()
        else:
            self.output_rows["caption_eng"].grid_remove()
            self.output_rows["caption_las"].grid_remove()

    def _raw_fields_for_task(self) -> dict[str, str]:
        return {field: self.field_vars[field].get().strip() for field in pathmaker_fields_for_task(self.task_var.get())}

    def _path_fields_for_task(self) -> dict[str, str]:
        return {field: self.field_vars[field].get().strip() for field in pathmaker_fields_for_task(self.task_var.get(), for_path_only=True)}

    def _companion_caption_outputs(self, task: str, raw_fields: dict[str, str]) -> tuple[str, str] | None:
        caption_task = COMPANION_CAPTION_TASKS.get(task)
        if caption_task is None:
            return None

        english_fields = dict(raw_fields)
        english_fields[FIELD_LANGUAGE] = "English"
        english_fields["house_language"] = raw_fields.get(FIELD_LANGUAGE, "")
        english_fields[FIELD_SUBTITLE_TYPE] = SUBTITLE_DEFAULT_BY_LANGUAGE["English"]

        spanish_fields = dict(raw_fields)
        spanish_fields[FIELD_LANGUAGE] = "Spanish"
        spanish_fields["house_language"] = raw_fields.get(FIELD_LANGUAGE, "")
        spanish_fields[FIELD_SUBTITLE_TYPE] = SUBTITLE_DEFAULT_BY_LANGUAGE["Spanish"]

        return (
            build_filename(caption_task, english_fields),
            build_filename(caption_task, spanish_fields),
        )

    def _generate_name(self) -> None:
        task = self.task_var.get()
        raw_fields = self._raw_fields_for_task()
        try:
            filename = build_filename(task, raw_fields)
            companion_captions = self._companion_caption_outputs(task, raw_fields)
            external_reference = build_external_reference(task, raw_fields)
        except ValueError as error:
            self._clear_name_outputs()
            self.status_var.set(str(error))
            return
        self.output_vars["video"].set(filename)
        if companion_captions is not None:
            self.output_vars["caption_eng"].set(companion_captions[0])
            self.output_vars["caption_las"].set(companion_captions[1])
        else:
            self.output_vars["caption_eng"].set("")
            self.output_vars["caption_las"].set("")
        self.output_vars["external_reference"].set(external_reference)
        if plus_warning_needed(raw_fields):
            self.status_var.set(f"Name generated. {PLUS_WARNING_MESSAGE}")
        else:
            self.status_var.set("Name generated.")

    def _generate_path(self) -> None:
        try:
            self.output_vars["path"].set(build_pathmaker_path(self.task_var.get(), self._path_fields_for_task()))
        except ValueError as error:
            self.output_vars["path"].set("")
            self.status_var.set(str(error))
            return
        self.status_var.set("Path generated.")

    def _clear_name_outputs(self) -> None:
        for key in ("video", "caption_eng", "caption_las", "external_reference"):
            self.output_vars[key].set("")

    def _clear_outputs(self) -> None:
        for variable in self.output_vars.values():
            variable.set("")

    def _clear_fields(self) -> None:
        for field, variable in self.field_vars.items():
            variable.set(PATHMAKER_DEFAULTS.get(field, DEFAULT_VALUES.get(field, "")))
        self._subtitle_type_manual_override = False
        self._refresh_task_ui()
        self.status_var.set("")

    def _copy_all(self) -> None:
        values = [variable.get().strip() for variable in self.output_vars.values()]
        text = "\n".join(value for value in values if value)
        if not text:
            messagebox.showwarning(APP_TITLE, "No output to copy.")
            return
        self.root.clipboard_clear()
        self.root.clipboard_append(text)
        self.status_var.set("Outputs copied.")


def main() -> None:
    root = tk.Tk()
    NebPathMakerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
