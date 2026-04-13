"""Neb filename assistant aligned to Axinom Section 7 examples."""

from __future__ import annotations

import csv
import re
import unicodedata
from pathlib import Path
from typing import Callable
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

APP_TITLE = "Name Everything Better"
WINDOW_WIDTH = 940
WINDOW_HEIGHT = 720

FIELD_TITLE = "title"
FIELD_LANGUAGE = "language"
FIELD_SUBTITLE_TYPE = "subtitle_type"
FIELD_RESOLUTION = "resolution"
FIELD_HOUSE = "house"
FIELD_SEASON = "season"
FIELD_EPISODE = "episode"
FIELD_INTERVIEWEES = "interviewees"
FIELD_YEAR = "year"
FIELD_EXTRA_USAGE = "extra_usage"

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
    FIELD_EXTRA_USAGE: "Extra Usage *",
}
TASK_FIELD_LABEL_OVERRIDES: dict[str, dict[str, str]] = {
    "Episode": {
        FIELD_TITLE: "Series Title *",
    },
    "Episode Caption": {
        FIELD_TITLE: "Series Title *",
    },
    "Virtual Screening Episode": {
        FIELD_TITLE: "Series Title *",
    },
    "Virtual Screening Episode Caption": {
        FIELD_TITLE: "Series Title *",
    },
}

LANGUAGE_OPTIONS = ("English", "Spanish")
SUBTITLE_TYPE_OPTIONS = ("cc", "sub")
RESOLUTION_OPTIONS = ("hd", "sd", "4k")
SUBTITLE_DEFAULT_BY_LANGUAGE = {
    "English": "cc",
    "Spanish": "cc",
}
EXTRA_USAGE_TO_PREFIX = {
    "Behind the Scenes / Making Of": "bts",
    "Interviews (Cast/Crew)": "int",
    "Deleted Scenes": "del",
    "Bloopers / Alternate Takes": "alt",
    "Music Videos": "mus",
    "Promotional Clips": "clp",
}
EXTRA_USAGE_OPTIONS = tuple(EXTRA_USAGE_TO_PREFIX.keys())

TASKS: dict[str, dict[str, object]] = {
    "Movie": {
        "fields": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_RESOLUTION, FIELD_HOUSE),
        "house_prefixes": ("PUR", "PFP"),
        "bulk_group": "feature",
    },
    "Caption": {
        "fields": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_SUBTITLE_TYPE, FIELD_RESOLUTION, FIELD_HOUSE),
        "house_prefixes": ("PUR", "PFP"),
        "bulk_group": "feature",
    },
    "Dub Audio": {
        "fields": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_RESOLUTION, FIELD_HOUSE),
        "house_prefixes": ("PUR", "PFP"),
        "bulk_group": "feature",
    },
    "Episode": {
        "fields": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_SEASON, FIELD_EPISODE, FIELD_RESOLUTION, FIELD_HOUSE),
        "house_prefixes": ("PUR", "PFP"),
        "bulk_group": "episode",
    },
    "Episode Caption": {
        "fields": (
            FIELD_TITLE,
            FIELD_LANGUAGE,
            FIELD_SUBTITLE_TYPE,
            FIELD_SEASON,
            FIELD_EPISODE,
            FIELD_RESOLUTION,
            FIELD_HOUSE,
        ),
        "house_prefixes": ("PUR", "PFP"),
        "bulk_group": "episode",
    },
    "Original Premium Series (Yearly)": {
        "fields": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_YEAR, FIELD_EPISODE, FIELD_RESOLUTION, FIELD_HOUSE),
        "house_prefixes": ("PFP",),
        "bulk_group": "premium_series",
    },
    "Exclusive Conversation (Yearly)": {
        "fields": (FIELD_LANGUAGE, FIELD_YEAR, FIELD_EPISODE, FIELD_INTERVIEWEES, FIELD_RESOLUTION, FIELD_HOUSE),
        "house_prefixes": ("PFP",),
        "bulk_group": "premium_series",
    },
    "Virtual Screening": {
        "fields": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_RESOLUTION, FIELD_HOUSE),
        "house_prefixes": ("PFP",),
        "bulk_group": "virtual_screening",
    },
    "Virtual Screening Episode": {
        "fields": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_SEASON, FIELD_EPISODE, FIELD_RESOLUTION, FIELD_HOUSE),
        "house_prefixes": ("PFP",),
        "bulk_group": "virtual_screening_episode",
    },
    "Virtual Screening Episode Caption": {
        "fields": (
            FIELD_TITLE,
            FIELD_LANGUAGE,
            FIELD_SUBTITLE_TYPE,
            FIELD_SEASON,
            FIELD_EPISODE,
            FIELD_RESOLUTION,
            FIELD_HOUSE,
        ),
        "house_prefixes": ("PFP",),
        "bulk_group": "virtual_screening_episode",
    },
    "Trailer": {
        "fields": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_RESOLUTION, FIELD_HOUSE),
        "house_prefixes": ("TRL",),
        "bulk_group": "trailer",
    },
    "Trailer Caption": {
        "fields": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_SUBTITLE_TYPE, FIELD_RESOLUTION, FIELD_HOUSE),
        "house_prefixes": ("TRL",),
        "bulk_group": "trailer",
    },
    "Extras": {
        "fields": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_EXTRA_USAGE, FIELD_RESOLUTION, FIELD_HOUSE),
        "house_prefixes": ("EXT",),
        "bulk_group": "extras",
    },
}
SINGLE_HIDDEN_TASKS = {
    "Caption",
    "Episode Caption",
    "Trailer Caption",
    "Virtual Screening Episode Caption",
}
COMPANION_CAPTION_TASKS = {
    "Movie": "Caption",
    "Episode": "Episode Caption",
    "Trailer": "Trailer Caption",
    "Virtual Screening Episode": "Virtual Screening Episode Caption",
}

DEFAULT_VALUES = {
    FIELD_TITLE: "",
    FIELD_LANGUAGE: "English",
    FIELD_SUBTITLE_TYPE: "cc",
    FIELD_RESOLUTION: "hd",
    FIELD_HOUSE: "",
    FIELD_SEASON: "01",
    FIELD_EPISODE: "01",
    FIELD_INTERVIEWEES: "",
    FIELD_YEAR: "2025",
    FIELD_EXTRA_USAGE: "Behind the Scenes / Making Of",
}

CSV_FILENAME = "filename"
CSV_MOV_FILENAME = "mov_filename"
CSV_CAPTION_ENG_FILENAME = "english_caption_filename"
CSV_CAPTION_LAS_FILENAME = "spanish_caption_filename"
CSV_TITLE = "title"
CSV_LANGUAGE = "language"
CSV_CAPTION_TYPE = "caption_type"
CSV_RESOLUTION = "resolution"
CSV_HOUSE = "house_number"
CSV_SEASON = "season"
CSV_EPISODE = "episode"
CSV_INTERVIEWEES = "interviewees"
CSV_YEAR = "year"
CSV_EXTRA_USAGE = "extra_usage"

CSV_HEADERS = (
    CSV_TITLE,
    CSV_LANGUAGE,
    CSV_CAPTION_TYPE,
    CSV_RESOLUTION,
    CSV_HOUSE,
    CSV_SEASON,
    CSV_EPISODE,
    CSV_INTERVIEWEES,
    CSV_YEAR,
    CSV_EXTRA_USAGE,
)

CSV_HEADER_TO_FIELD = {
    CSV_TITLE: FIELD_TITLE,
    CSV_LANGUAGE: FIELD_LANGUAGE,
    CSV_CAPTION_TYPE: FIELD_SUBTITLE_TYPE,
    CSV_RESOLUTION: FIELD_RESOLUTION,
    CSV_HOUSE: FIELD_HOUSE,
    CSV_SEASON: FIELD_SEASON,
    CSV_EPISODE: FIELD_EPISODE,
    CSV_INTERVIEWEES: FIELD_INTERVIEWEES,
    CSV_YEAR: FIELD_YEAR,
    CSV_EXTRA_USAGE: FIELD_EXTRA_USAGE,
}
PLUS_WARNING_FIELDS = (FIELD_TITLE, FIELD_INTERVIEWEES)
PLUS_WARNING_MESSAGE = 'Warning: Please make sure your + symbol translated correctly to [and/plus]. If not, please enter "and" or "plus".'

SLUG_SAFE_PATTERN = re.compile(r"[^a-z0-9]+")


def slugify(value: str) -> str:
    lowered = value.strip().lower()
    lowered = lowered.replace("'", "").replace("’", "")
    lowered = re.sub(r"\s+\+\s+", " and ", lowered)
    lowered = lowered.replace("&", " and ")
    lowered = lowered.replace("@", " at ")
    lowered = lowered.replace("+", " plus ")
    lowered = lowered.replace("·", "")
    lowered = lowered.replace("*", "")
    lowered = lowered.replace("!", "")
    lowered = lowered.replace(".", "")
    normalized = unicodedata.normalize("NFKD", lowered)
    without_accents = "".join(char for char in normalized if not unicodedata.combining(char))
    slug = SLUG_SAFE_PATTERN.sub("_", without_accents)
    slug = re.sub(r"_+", "_", slug).strip("_")
    return slug.replace("veggie_tales", "veggietales")


def plus_warning_needed(raw_fields: dict[str, str]) -> bool:
    return any("+" in raw_fields.get(field, "") for field in PLUS_WARNING_FIELDS)


def normalize_resolution(value: str) -> str:
    resolution = value.strip().lower()
    if resolution not in {"sd", "hd", "4k"}:
        raise ValueError("Resolution must be sd, hd, or 4k.")
    return resolution


def normalize_house(value: str, allowed_prefixes: tuple[str, ...]) -> str:
    house = value.strip().upper()
    match = re.fullmatch(r"([A-Z]{3})(\d{7})", house)
    if not match:
        raise ValueError("House Number must be 3 letters followed by 7 digits.")
    prefix = match.group(1)
    if prefix not in allowed_prefixes:
        allowed = ", ".join(allowed_prefixes)
        raise ValueError(f"House Number must start with {allowed}.")
    return house


def normalize_language(value: str) -> str:
    language = value.strip()
    if language not in LANGUAGE_OPTIONS:
        raise ValueError("Language must be English or Spanish.")
    return language


def normalize_subtitle_type(value: str) -> str:
    subtitle_type = value.strip().lower()
    if subtitle_type not in {"cc", "sub"}:
        raise ValueError("Caption Type must be cc or sub.")
    return subtitle_type


def normalize_season(value: str) -> str:
    raw = value.strip().lower()
    if raw.startswith("s"):
        raw = raw[1:]
    if not raw.isdigit() or len(raw) != 2:
        raise ValueError("Season must be 2 digits, for example 01.")
    return f"s{raw}"


def normalize_episode(value: str) -> str:
    raw = value.strip().lower()
    if raw.startswith("e"):
        raw = raw[1:]
    if not raw.isdigit():
        raise ValueError("Episode must be numeric, for example 01.")
    episode_num = int(raw)
    if episode_num < 1 or episode_num > 999:
        raise ValueError("Episode must be between 1 and 999.")
    return f"e{episode_num:02d}"


def normalize_year(value: str) -> str:
    year = value.strip()
    if not re.fullmatch(r"\d{4}", year):
        raise ValueError("Year must be 4 digits, for example 2025.")
    return year


def normalize_interviewees(value: str) -> str:
    interviewees = slugify(value)
    if not interviewees:
        raise ValueError("Interviewee(s) is required.")
    return interviewees


def build_filename(task: str, raw_fields: dict[str, str]) -> str:
    allowed_prefixes = TASKS[task]["house_prefixes"]  # type: ignore[index]
    resolution = normalize_resolution(raw_fields.get(FIELD_RESOLUTION, ""))
    house = normalize_house(raw_fields.get(FIELD_HOUSE, ""), allowed_prefixes)  # type: ignore[arg-type]

    if task == "Movie":
        title = slugify(raw_fields.get(FIELD_TITLE, ""))
        if not title:
            raise ValueError("Title is required.")
        language = normalize_language(raw_fields.get(FIELD_LANGUAGE, ""))
        if language == "Spanish":
            return f"{title}_feature_{resolution}_{house}_las.mov"
        return f"{title}_feature_{resolution}_{house}_eng.mov"

    if task == "Caption":
        title = slugify(raw_fields.get(FIELD_TITLE, ""))
        if not title:
            raise ValueError("Title is required.")
        language = normalize_language(raw_fields.get(FIELD_LANGUAGE, ""))
        subtitle_raw = raw_fields.get(FIELD_SUBTITLE_TYPE, "").strip().lower() or SUBTITLE_DEFAULT_BY_LANGUAGE[language].lower()
        subtitle_type = normalize_subtitle_type(subtitle_raw)
        if language == "Spanish":
            return f"{title}_feature_las_{resolution}_{house}_{subtitle_type}_las.vtt"
        return f"{title}_feature_{resolution}_{house}_{subtitle_type}_eng.vtt"

    if task == "Dub Audio":
        title = slugify(raw_fields.get(FIELD_TITLE, ""))
        if not title:
            raise ValueError("Title is required.")
        language = normalize_language(raw_fields.get(FIELD_LANGUAGE, ""))
        if language != "Spanish":
            raise ValueError("Dub Audio is only supported for Spanish in the current Section 7 examples.")
        return f"{title}_feature_{resolution}_{house}_dub_las.wav"

    if task == "Episode":
        title = slugify(raw_fields.get(FIELD_TITLE, ""))
        if not title:
            raise ValueError("Title is required.")
        language = normalize_language(raw_fields.get(FIELD_LANGUAGE, ""))
        season = normalize_season(raw_fields.get(FIELD_SEASON, ""))
        episode = normalize_episode(raw_fields.get(FIELD_EPISODE, ""))
        if language == "Spanish":
            return f"{title}_{season}_{episode}_{resolution}_{house}_las.mov"
        return f"{title}_{season}_{episode}_{resolution}_{house}_eng.mov"

    if task == "Episode Caption":
        title = slugify(raw_fields.get(FIELD_TITLE, ""))
        if not title:
            raise ValueError("Title is required.")
        language = normalize_language(raw_fields.get(FIELD_LANGUAGE, ""))
        subtitle_raw = raw_fields.get(FIELD_SUBTITLE_TYPE, "").strip().lower() or SUBTITLE_DEFAULT_BY_LANGUAGE[language].lower()
        subtitle_type = normalize_subtitle_type(subtitle_raw)
        season = normalize_season(raw_fields.get(FIELD_SEASON, ""))
        episode = normalize_episode(raw_fields.get(FIELD_EPISODE, ""))
        if language == "Spanish":
            return f"{title}_{season}_{episode}_las_{resolution}_{house}_{subtitle_type}_las.vtt"
        return f"{title}_{season}_{episode}_{resolution}_{house}_{subtitle_type}_eng.vtt"

    if task == "Original Premium Series (Yearly)":
        title = slugify(raw_fields.get(FIELD_TITLE, ""))
        if not title:
            raise ValueError("Title is required.")
        language = normalize_language(raw_fields.get(FIELD_LANGUAGE, ""))
        year = normalize_year(raw_fields.get(FIELD_YEAR, ""))
        episode = normalize_episode(raw_fields.get(FIELD_EPISODE, ""))
        return f"{title}_s{year}_{episode}_{resolution}_{house}_{'las' if language == 'Spanish' else 'eng'}.mov"

    if task == "Exclusive Conversation (Yearly)":
        language = normalize_language(raw_fields.get(FIELD_LANGUAGE, ""))
        interviewees = normalize_interviewees(raw_fields.get(FIELD_INTERVIEWEES, ""))
        year = normalize_year(raw_fields.get(FIELD_YEAR, ""))
        episode = normalize_episode(raw_fields.get(FIELD_EPISODE, ""))
        return f"exclusive_conversations_s{year}_{episode}_{interviewees}_{resolution}_{house}_{'las' if language == 'Spanish' else 'eng'}.mov"

    if task == "Virtual Screening":
        title = slugify(raw_fields.get(FIELD_TITLE, ""))
        if not title:
            raise ValueError("Title is required.")
        language = normalize_language(raw_fields.get(FIELD_LANGUAGE, ""))
        return f"{title}_virtual_screening_{resolution}_{house}_{'las' if language == 'Spanish' else 'eng'}.mov"

    if task == "Virtual Screening Episode":
        title = slugify(raw_fields.get(FIELD_TITLE, ""))
        if not title:
            raise ValueError("Series Title is required.")
        language = normalize_language(raw_fields.get(FIELD_LANGUAGE, ""))
        season = normalize_season(raw_fields.get(FIELD_SEASON, ""))
        episode = normalize_episode(raw_fields.get(FIELD_EPISODE, ""))
        return f"{title}_{season}_{episode}_virtual_screening_{resolution}_{house}_{'las' if language == 'Spanish' else 'eng'}.mov"

    if task == "Virtual Screening Episode Caption":
        title = slugify(raw_fields.get(FIELD_TITLE, ""))
        if not title:
            raise ValueError("Series Title is required.")
        language = normalize_language(raw_fields.get(FIELD_LANGUAGE, ""))
        subtitle_raw = raw_fields.get(FIELD_SUBTITLE_TYPE, "").strip().lower() or SUBTITLE_DEFAULT_BY_LANGUAGE[language].lower()
        subtitle_type = normalize_subtitle_type(subtitle_raw)
        season = normalize_season(raw_fields.get(FIELD_SEASON, ""))
        episode = normalize_episode(raw_fields.get(FIELD_EPISODE, ""))
        if language == "Spanish":
            return f"{title}_{season}_{episode}_virtual_screening_las_{resolution}_{house}_{subtitle_type}_las.vtt"
        return f"{title}_{season}_{episode}_virtual_screening_{resolution}_{house}_{subtitle_type}_eng.vtt"

    if task == "Trailer":
        title = slugify(raw_fields.get(FIELD_TITLE, ""))
        if not title:
            raise ValueError("Title is required.")
        language = normalize_language(raw_fields.get(FIELD_LANGUAGE, ""))
        return f"{title}_trailer_{resolution}_{house}_{'las' if language == 'Spanish' else 'eng'}.mov"

    if task == "Trailer Caption":
        title = slugify(raw_fields.get(FIELD_TITLE, ""))
        if not title:
            raise ValueError("Title is required.")
        language = normalize_language(raw_fields.get(FIELD_LANGUAGE, ""))
        subtitle_raw = raw_fields.get(FIELD_SUBTITLE_TYPE, "").strip().lower() or SUBTITLE_DEFAULT_BY_LANGUAGE[language].lower()
        subtitle_type = normalize_subtitle_type(subtitle_raw)
        if language == "Spanish":
            return f"{title}_trailer_las_{resolution}_{house}_{subtitle_type}_las.vtt"
        return f"{title}_trailer_{resolution}_{house}_{subtitle_type}_eng.vtt"

    if task == "Extras":
        title = slugify(raw_fields.get(FIELD_TITLE, ""))
        if not title:
            raise ValueError("Title is required.")
        language = normalize_language(raw_fields.get(FIELD_LANGUAGE, ""))
        usage = raw_fields.get(FIELD_EXTRA_USAGE, "").strip()
        extra_prefix = EXTRA_USAGE_TO_PREFIX.get(usage)
        if not extra_prefix:
            raise ValueError("Choose an Extra Usage from the Section 5.2 list.")
        return f"{title}_{extra_prefix}_{resolution}_{house}_{'las' if language == 'Spanish' else 'eng'}.mov"

    raise ValueError("Unsupported task type.")


class NebFilenameAssistant:
    def __init__(self, root: tk.Tk, home_callback: Callable[[], None] | None = None) -> None:
        self.root = root
        self.home_callback = home_callback
        self.root.title(APP_TITLE)
        self.root.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}")
        self.root.minsize(900, 640)

        self.mode_var = tk.StringVar(value="")
        self.task_var = tk.StringVar(value=next(iter(TASKS.keys())))
        self.multi_task_var = tk.StringVar(value=next(iter(TASKS.keys())))
        self.status_var = tk.StringVar(value="")
        self.single_output_vars = {
            "video": tk.StringVar(value=""),
            "caption_eng": tk.StringVar(value=""),
            "caption_las": tk.StringVar(value=""),
        }
        self.batch_input_path_var = tk.StringVar(value="No CSV selected.")
        self.batch_output_path_var = tk.StringVar(value="")
        self.multi_help_var = tk.StringVar(value=self._multi_help_text(self.multi_task_var.get()))

        self.field_vars = {field: tk.StringVar(value=default) for field, default in DEFAULT_VALUES.items()}
        self.field_rows: dict[str, ttk.Frame] = {}
        self.field_labels: dict[str, ttk.Label] = {}
        self.batch_csv_path: Path | None = None
        self._subtitle_type_manual_override = False
        self._suppress_subtitle_tracking = False

        self._build_ui()
        self._bind_field_logic()
        self._refresh_task_ui()

    def _build_ui(self) -> None:
        self.main = ttk.Frame(self.root, padding=16)
        self.main.pack(fill="both", expand=True)

        self.welcome_frame = ttk.Frame(self.main)
        self.welcome_frame.pack(fill="both", expand=True)

        welcome_label = ttk.Label(
            self.welcome_frame,
            text="Hi, I'm Neb. Would you like to name one thing at a time or multiple things?",
            font=("", 13, "bold"),
            wraplength=760,
            justify="center",
        )
        welcome_label.pack(pady=(120, 20))

        button_row = ttk.Frame(self.welcome_frame)
        button_row.pack()
        ttk.Button(
            button_row,
            text="One Thing At A Time",
            command=lambda: self._choose_mode("single"),
            width=26,
        ).pack(side="left", padx=8)
        ttk.Button(
            button_row,
            text="Multiple Things",
            command=lambda: self._choose_mode("multi"),
            width=20,
        ).pack(side="left", padx=8)

        self.builder_frame = ttk.Frame(self.main)

        top_row = ttk.Frame(self.builder_frame)
        top_row.pack(fill="x", pady=(0, 8))
        ttk.Button(top_row, text="Back", command=self._go_home).pack(side="left")
        self.mode_prompt_label = ttk.Label(top_row, text="", font=("", 12, "bold"))
        self.mode_prompt_label.pack(side="left", padx=(10, 0))

        self.task_row = ttk.Frame(self.builder_frame)
        self.task_row.pack(fill="x", pady=(0, 10))
        ttk.Label(self.task_row, text="Naming Task", width=18).pack(side="left")
        task_combo = ttk.Combobox(
            self.task_row,
            textvariable=self.task_var,
            values=self._single_task_options(),
            state="readonly",
        )
        task_combo.pack(side="left", fill="x", expand=True)
        task_combo.bind("<<ComboboxSelected>>", lambda _event: self._refresh_task_ui())

        self.single_frame = ttk.Frame(self.builder_frame)
        self.single_frame.pack(fill="x", pady=(0, 10))

        self.single_fields_frame = ttk.LabelFrame(self.single_frame, text="Required Fields")
        self.single_fields_frame.pack(fill="x")
        self._build_single_field_rows()

        single_buttons = ttk.Frame(self.single_frame)
        single_buttons.pack(fill="x", pady=(10, 6))
        ttk.Button(single_buttons, text="Generate Names", command=self._generate_single).pack(side="right")
        ttk.Button(single_buttons, text="Clear", command=self._clear_single_fields).pack(side="right", padx=(0, 8))

        output_frame = ttk.LabelFrame(self.single_frame, text="Generated Names")
        output_frame.pack(fill="x")
        output_frame.columnconfigure(0, weight=1)
        self.single_output_rows: dict[str, ttk.Frame] = {}
        self.single_output_rows["video"] = self._add_output_row(output_frame, 0, "MOV Name", self.single_output_vars["video"])
        self.single_output_rows["caption_eng"] = self._add_output_row(output_frame, 1, "English Caption", self.single_output_vars["caption_eng"])
        self.single_output_rows["caption_las"] = self._add_output_row(output_frame, 2, "Spanish Caption", self.single_output_vars["caption_las"])
        ttk.Button(output_frame, text="Copy All", command=self._copy_single).grid(
            row=3, column=1, sticky="e", padx=(0, 10), pady=(0, 10)
        )

        self.multi_frame = ttk.Frame(self.builder_frame)
        ttk.Label(
            self.multi_frame,
            text="Choose one filename type, download its CSV template, then upload a batch for that type.",
            wraplength=840,
            justify="left",
        ).pack(anchor="w", pady=(0, 8))

        task_picker = ttk.LabelFrame(self.multi_frame, text="1. Choose The Filename Type")
        task_picker.pack(fill="x", pady=(0, 10))
        task_picker.columnconfigure(0, weight=1)
        ttk.Combobox(
            task_picker,
            textvariable=self.multi_task_var,
            values=self._multi_task_options(),
            state="readonly",
        ).grid(row=0, column=0, sticky="ew", padx=10, pady=10)

        multi_help_frame = ttk.LabelFrame(self.multi_frame, text="CSV Guide")
        multi_help_frame.pack(fill="x", pady=(0, 10))
        ttk.Label(
            multi_help_frame,
            textvariable=self.multi_help_var,
            wraplength=820,
            justify="left",
        ).pack(anchor="w", padx=10, pady=10)

        template_buttons = ttk.Frame(self.multi_frame)
        template_buttons.pack(fill="x", pady=(0, 10))
        ttk.Button(template_buttons, text="Download Custom CSV Template", command=self._download_csv_template).pack(side="left")

        input_frame = ttk.LabelFrame(self.multi_frame, text="Upload CSV")
        input_frame.pack(fill="x", pady=(0, 10))
        input_frame.columnconfigure(0, weight=1)
        ttk.Entry(input_frame, textvariable=self.batch_input_path_var, state="readonly").grid(
            row=0, column=0, sticky="ew", padx=(10, 8), pady=10
        )
        ttk.Button(input_frame, text="Choose CSV", command=self._choose_batch_csv).grid(
            row=0, column=1, sticky="e", padx=(0, 10), pady=10
        )

        output_frame = ttk.LabelFrame(self.multi_frame, text="Output CSV")
        output_frame.pack(fill="x")
        output_frame.columnconfigure(0, weight=1)
        ttk.Entry(output_frame, textvariable=self.batch_output_path_var, state="readonly").grid(
            row=0, column=0, sticky="ew", padx=(10, 8), pady=(10, 6)
        )
        ttk.Button(output_frame, text="Generate Output CSV", command=self._generate_batch_csv).grid(
            row=0, column=1, sticky="e", padx=(0, 10), pady=(10, 6)
        )

        ttk.Label(self.builder_frame, textvariable=self.status_var).pack(anchor="w", pady=(6, 0))

    def _build_single_field_rows(self) -> None:
        self.field_rows[FIELD_TITLE] = self._add_entry_row(self.single_fields_frame, FIELD_LABELS[FIELD_TITLE], self.field_vars[FIELD_TITLE])
        self.field_rows[FIELD_LANGUAGE] = self._add_combo_row(
            self.single_fields_frame, FIELD_LABELS[FIELD_LANGUAGE], self.field_vars[FIELD_LANGUAGE], LANGUAGE_OPTIONS
        )
        self.field_rows[FIELD_SUBTITLE_TYPE] = self._add_combo_row(
            self.single_fields_frame,
            FIELD_LABELS[FIELD_SUBTITLE_TYPE],
            self.field_vars[FIELD_SUBTITLE_TYPE],
            SUBTITLE_TYPE_OPTIONS,
        )
        self.field_rows[FIELD_SEASON] = self._add_entry_row(
            self.single_fields_frame, FIELD_LABELS[FIELD_SEASON], self.field_vars[FIELD_SEASON], width=12
        )
        self.field_rows[FIELD_EPISODE] = self._add_entry_row(
            self.single_fields_frame, FIELD_LABELS[FIELD_EPISODE], self.field_vars[FIELD_EPISODE], width=12
        )
        self.field_rows[FIELD_INTERVIEWEES] = self._add_entry_row(
            self.single_fields_frame, FIELD_LABELS[FIELD_INTERVIEWEES], self.field_vars[FIELD_INTERVIEWEES]
        )
        self.field_rows[FIELD_YEAR] = self._add_entry_row(
            self.single_fields_frame, FIELD_LABELS[FIELD_YEAR], self.field_vars[FIELD_YEAR], width=12
        )
        self.field_rows[FIELD_EXTRA_USAGE] = self._add_combo_row(
            self.single_fields_frame,
            FIELD_LABELS[FIELD_EXTRA_USAGE],
            self.field_vars[FIELD_EXTRA_USAGE],
            EXTRA_USAGE_OPTIONS,
        )
        self.field_rows[FIELD_RESOLUTION] = self._add_combo_row(
            self.single_fields_frame, FIELD_LABELS[FIELD_RESOLUTION], self.field_vars[FIELD_RESOLUTION], RESOLUTION_OPTIONS
        )
        self.field_rows[FIELD_HOUSE] = self._add_entry_row(self.single_fields_frame, FIELD_LABELS[FIELD_HOUSE], self.field_vars[FIELD_HOUSE])

    def _add_entry_row(self, parent: ttk.Widget, label: str, variable: tk.StringVar, width: int = 40) -> ttk.Frame:
        row = ttk.Frame(parent)
        label_widget = ttk.Label(row, text=label, width=22)
        label_widget.pack(side="left")
        ttk.Entry(row, textvariable=variable, width=width).pack(side="left", fill="x", expand=True)
        for field_name, field_label in FIELD_LABELS.items():
            if field_label == label:
                self.field_labels[field_name] = label_widget
                break
        return row

    def _add_combo_row(
        self,
        parent: ttk.Widget,
        label: str,
        variable: tk.StringVar,
        values: tuple[str, ...],
    ) -> ttk.Frame:
        row = ttk.Frame(parent)
        label_widget = ttk.Label(row, text=label, width=22)
        label_widget.pack(side="left")
        ttk.Combobox(row, textvariable=variable, values=values, state="readonly", width=30).pack(side="left")
        for field_name, field_label in FIELD_LABELS.items():
            if field_label == label:
                self.field_labels[field_name] = label_widget
                break
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
        self.multi_task_var.trace_add("write", self._on_multi_task_change)
        self.field_vars[FIELD_LANGUAGE].trace_add("write", self._on_language_change)
        self.field_vars[FIELD_SUBTITLE_TYPE].trace_add("write", self._on_subtitle_type_change)

    def _task_uses_subtitle_type(self, task: str) -> bool:
        return FIELD_SUBTITLE_TYPE in TASKS[task]["fields"]  # type: ignore[index]

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
        self._apply_subtitle_default()

    def _on_subtitle_type_change(self, *_args: object) -> None:
        if self._suppress_subtitle_tracking:
            return
        self._subtitle_type_manual_override = True

    def _multi_fields_for_task(self, task_name: str) -> list[str]:
        return list(TASKS[task_name]["fields"])  # type: ignore[index]

    def _single_task_options(self) -> tuple[str, ...]:
        return tuple(task_name for task_name in TASKS.keys() if task_name not in SINGLE_HIDDEN_TASKS)

    def _multi_task_options(self) -> tuple[str, ...]:
        return self._single_task_options()

    def _csv_headers_for_task(self, task_name: str) -> list[str]:
        reverse_map = {field: header for header, field in CSV_HEADER_TO_FIELD.items()}
        return [reverse_map[field] for field in self._multi_fields_for_task(task_name)]

    def _on_multi_task_change(self, *_args: object) -> None:
        self.multi_help_var.set(self._multi_help_text(self.multi_task_var.get()))
        if self.mode_var.get() == "multi":
            self.status_var.set("Download the template for this filename type, then upload your CSV.")

    def _choose_mode(self, mode: str) -> None:
        self.mode_var.set(mode)
        self.welcome_frame.pack_forget()
        self.builder_frame.pack(fill="both", expand=True)
        self._refresh_task_ui()
        if mode == "single":
            self.status_var.set("Fill required fields and click Generate Names.")
        else:
            self.multi_help_var.set(self._multi_help_text(self.multi_task_var.get()))
            self.status_var.set("Choose one filename type, then download the custom template.")

    def _go_home(self) -> None:
        if self.home_callback is not None:
            self.main.destroy()
            self.home_callback()
            return
        self.mode_var.set("")
        self.builder_frame.pack_forget()
        self.welcome_frame.pack(fill="both", expand=True)
        self.status_var.set("")
        self.batch_output_path_var.set("")

    def _refresh_task_ui(self) -> None:
        if self.mode_var.get() == "multi":
            self.mode_prompt_label.config(text="Great, let's do multiple filenames.")
            self.task_row.pack_forget()
            self.single_frame.pack_forget()
            self.multi_frame.pack(fill="both", expand=True, pady=(0, 8))
        else:
            task = self.task_var.get()
            required_fields = TASKS[task]["fields"]  # type: ignore[index]
            self._subtitle_type_manual_override = False
            self._apply_subtitle_default(force=True)
            self.mode_prompt_label.config(text="Great, which filename do you need?")
            self.task_row.pack(fill="x", pady=(0, 10))
            self.multi_frame.pack_forget()
            self.single_frame.pack(fill="x", pady=(0, 10))
            self._refresh_field_labels(task)
            self._render_single_rows(required_fields)

    def _refresh_field_labels(self, task: str) -> None:
        overrides = TASK_FIELD_LABEL_OVERRIDES.get(task, {})
        for field_name, label_widget in self.field_labels.items():
            label_widget.config(text=overrides.get(field_name, FIELD_LABELS[field_name]))

    def _render_single_rows(self, required_fields: tuple[str, ...]) -> None:
        for row in self.field_rows.values():
            row.pack_forget()
        for field in required_fields:
            self.field_rows[field].pack(fill="x", pady=4)
        self._clear_single_outputs()
        self._refresh_output_rows()

    def _clear_single_outputs(self) -> None:
        for variable in self.single_output_vars.values():
            variable.set("")

    def _refresh_output_rows(self) -> None:
        has_companion_captions = self.task_var.get() in COMPANION_CAPTION_TASKS
        self.single_output_rows["video"].grid()
        if has_companion_captions:
            self.single_output_rows["caption_eng"].grid()
            self.single_output_rows["caption_las"].grid()
        else:
            self.single_output_rows["caption_eng"].grid_remove()
            self.single_output_rows["caption_las"].grid_remove()

    def _multi_help_text(self, task_name: str) -> str:
        headers = self._csv_headers_for_task(task_name)
        lines = [
            f"Selected type: {task_name}",
            f"CSV headers for this template: {', '.join(headers)}",
        ]
        if task_name in COMPANION_CAPTION_TASKS:
            lines.append(
                "The output CSV will add `mov_filename`, `english_caption_filename`, and `spanish_caption_filename` at the front."
            )
        else:
            lines.append("The output CSV will add a single `filename` column at the front.")
        if task_name in {"Episode", "Virtual Screening Episode"}:
            lines.append("For episode filenames, `title` should be the series title.")
        return "\n".join(lines)

    def _raw_fields_for_task(self) -> dict[str, str]:
        fields = TASKS[self.task_var.get()]["fields"]  # type: ignore[index]
        return {field: self.field_vars[field].get().strip() for field in fields}

    def _companion_caption_outputs(self, task: str, raw_fields: dict[str, str]) -> tuple[str, str] | None:
        caption_task = COMPANION_CAPTION_TASKS.get(task)
        if caption_task is None:
            return None

        english_fields = dict(raw_fields)
        english_fields[FIELD_LANGUAGE] = "English"
        english_fields[FIELD_SUBTITLE_TYPE] = SUBTITLE_DEFAULT_BY_LANGUAGE["English"]

        spanish_fields = dict(raw_fields)
        spanish_fields[FIELD_LANGUAGE] = "Spanish"
        spanish_fields[FIELD_SUBTITLE_TYPE] = SUBTITLE_DEFAULT_BY_LANGUAGE["Spanish"]

        return (
            build_filename(caption_task, english_fields),
            build_filename(caption_task, spanish_fields),
        )

    def _generate_single(self) -> None:
        task = self.task_var.get()
        raw_fields = self._raw_fields_for_task()
        try:
            filename = build_filename(task, raw_fields)
            companion_captions = self._companion_caption_outputs(task, raw_fields)
        except ValueError as error:
            self._clear_single_outputs()
            self.status_var.set(str(error))
            return
        self.single_output_vars["video"].set(filename)
        if companion_captions is not None:
            self.single_output_vars["caption_eng"].set(companion_captions[0])
            self.single_output_vars["caption_las"].set(companion_captions[1])
        else:
            self.single_output_vars["caption_eng"].set("")
            self.single_output_vars["caption_las"].set("")
        if plus_warning_needed(raw_fields):
            self.status_var.set(f'Names generated. {PLUS_WARNING_MESSAGE}')
        else:
            self.status_var.set("Names generated.")

    def _template_example_rows(self, headers: list[str], task_name: str) -> list[dict[str, str]]:
        first_row = {
            CSV_TITLE: "wild like me",
            CSV_LANGUAGE: "English",
            CSV_CAPTION_TYPE: "cc",
            CSV_RESOLUTION: "hd",
            CSV_HOUSE: "PUR0001050",
            CSV_SEASON: "01",
            CSV_EPISODE: "01",
            CSV_INTERVIEWEES: "",
            CSV_YEAR: "2025",
            CSV_EXTRA_USAGE: "Behind the Scenes / Making Of",
        }
        second_row = {
            CSV_TITLE: "wild like me",
            CSV_LANGUAGE: "Spanish",
            CSV_CAPTION_TYPE: "sub",
            CSV_RESOLUTION: "hd",
            CSV_HOUSE: "PUR0001051",
            CSV_SEASON: "01",
            CSV_EPISODE: "01",
            CSV_INTERVIEWEES: "",
            CSV_YEAR: "2025",
            CSV_EXTRA_USAGE: "Deleted Scenes",
        }

        if task_name in {"Episode", "Episode Caption"}:
            first_row[CSV_TITLE] = "county rescue"
            second_row[CSV_TITLE] = "county rescue"
            first_row[CSV_HOUSE] = "PUR0000363"
            second_row[CSV_HOUSE] = "PUR0000364"
        elif task_name in {"Virtual Screening Episode", "Virtual Screening Episode Caption"}:
            first_row[CSV_TITLE] = "when hope calls"
            second_row[CSV_TITLE] = "when hope calls"
            first_row[CSV_SEASON] = "03"
            second_row[CSV_SEASON] = "03"
            first_row[CSV_EPISODE] = "02"
            second_row[CSV_EPISODE] = "03"
            first_row[CSV_HOUSE] = "PFP1234567"
            second_row[CSV_HOUSE] = "PFP1234568"
        elif task_name in {"Trailer", "Trailer Caption"}:
            first_row[CSV_TITLE] = "gods not dead"
            second_row[CSV_TITLE] = "gods not dead"
            first_row[CSV_HOUSE] = "TRL0001197"
            second_row[CSV_HOUSE] = "TRL0001198"
        elif task_name == "Extras":
            first_row[CSV_TITLE] = "gods not dead"
            second_row[CSV_TITLE] = "gods not dead"
            first_row[CSV_HOUSE] = "EXT0002231"
            second_row[CSV_HOUSE] = "EXT0002232"
        elif task_name == "Original Premium Series (Yearly)":
            first_row[CSV_TITLE] = "pure devotions"
            second_row[CSV_TITLE] = "pure devotions"
            first_row[CSV_HOUSE] = "PFP0008892"
            second_row[CSV_HOUSE] = "PFP0008893"
        elif task_name == "Exclusive Conversation (Yearly)":
            first_row[CSV_YEAR] = "2026"
            second_row[CSV_YEAR] = "2026"
            first_row[CSV_EPISODE] = "09"
            second_row[CSV_EPISODE] = "10"
            first_row[CSV_INTERVIEWEES] = "Anthony Hopkins"
            second_row[CSV_INTERVIEWEES] = "Viola Davis"
            first_row[CSV_HOUSE] = "PFP0000155"
            second_row[CSV_HOUSE] = "PFP0000156"
        elif task_name == "Virtual Screening":
            first_row[CSV_TITLE] = "wild like me"
            second_row[CSV_TITLE] = "wild like me"
            first_row[CSV_HOUSE] = "PFP0001060"
            second_row[CSV_HOUSE] = "PFP0001061"

        if FIELD_SUBTITLE_TYPE not in TASKS[task_name]["fields"]:  # type: ignore[index]
            first_row[CSV_CAPTION_TYPE] = ""
            second_row[CSV_CAPTION_TYPE] = ""
        if FIELD_LANGUAGE not in TASKS[task_name]["fields"]:  # type: ignore[index]
            first_row[CSV_LANGUAGE] = ""
            second_row[CSV_LANGUAGE] = ""
        if FIELD_SEASON not in TASKS[task_name]["fields"]:  # type: ignore[index]
            first_row[CSV_SEASON] = ""
            second_row[CSV_SEASON] = ""
        if FIELD_EPISODE not in TASKS[task_name]["fields"]:  # type: ignore[index]
            first_row[CSV_EPISODE] = ""
            second_row[CSV_EPISODE] = ""
        if FIELD_YEAR not in TASKS[task_name]["fields"]:  # type: ignore[index]
            first_row[CSV_YEAR] = ""
            second_row[CSV_YEAR] = ""
        if FIELD_INTERVIEWEES not in TASKS[task_name]["fields"]:  # type: ignore[index]
            first_row[CSV_INTERVIEWEES] = ""
            second_row[CSV_INTERVIEWEES] = ""
        if FIELD_EXTRA_USAGE not in TASKS[task_name]["fields"]:  # type: ignore[index]
            first_row[CSV_EXTRA_USAGE] = ""
            second_row[CSV_EXTRA_USAGE] = ""

        return [
            {header: first_row.get(header, "") for header in headers},
            {header: second_row.get(header, "") for header in headers},
        ]

    def _download_csv_template(self) -> None:
        selected_task = self.multi_task_var.get()
        template_headers = self._csv_headers_for_task(selected_task)
        default_name = f"{slugify(selected_task)}_template.csv"
        path = filedialog.asksaveasfilename(
            title="Save CSV Template",
            defaultextension=".csv",
            initialfile=default_name,
            filetypes=[("CSV files", "*.csv")],
        )
        if not path:
            return

        with open(path, "w", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerow(template_headers)
            for row in self._template_example_rows(template_headers, selected_task):
                writer.writerow([row.get(header, "") for header in template_headers])

        self.status_var.set("CSV template saved with example rows.")

    def _choose_batch_csv(self) -> None:
        path = filedialog.askopenfilename(
            title="Choose Input CSV",
            filetypes=[("CSV files", "*.csv")],
        )
        if not path:
            return

        self.batch_csv_path = Path(path)
        self.batch_input_path_var.set(str(self.batch_csv_path))
        self.batch_output_path_var.set("")
        self.status_var.set("CSV selected. Generate the output CSV when ready.")

    def _read_batch_csv(self, path: Path) -> tuple[list[str], list[dict[str, str]]]:
        with path.open("r", newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames is None:
                raise ValueError("CSV is missing a header row.")

            input_headers = [header.strip() for header in reader.fieldnames]
            normalized_rows: list[dict[str, str]] = []
            for row in reader:
                normalized_row = {header.strip(): (value or "").strip() for header, value in row.items() if header is not None}
                if not any(normalized_row.values()):
                    continue
                normalized_rows.append(normalized_row)

        if not normalized_rows:
            raise ValueError("CSV has no data rows.")

        return input_headers, normalized_rows

    def _row_to_task_fields(self, row: dict[str, str]) -> dict[str, str]:
        return {
            field: row.get(csv_header, "").strip()
            for csv_header, field in CSV_HEADER_TO_FIELD.items()
        }

    def _generate_batch_csv(self) -> None:
        if self.batch_csv_path is None:
            self.status_var.set("Choose a CSV file first.")
            return

        selected_task = self.multi_task_var.get()

        try:
            input_headers, rows = self._read_batch_csv(self.batch_csv_path)
        except ValueError as error:
            self.status_var.set(str(error))
            return

        required_headers = self._csv_headers_for_task(selected_task)
        missing_headers = [header for header in required_headers if header not in input_headers]
        if missing_headers:
            self.status_var.set(f"CSV is missing required header(s): {', '.join(missing_headers)}.")
            return

        companion_caption_task = COMPANION_CAPTION_TASKS.get(selected_task)
        if companion_caption_task is not None:
            output_headers = [
                CSV_MOV_FILENAME,
                CSV_CAPTION_ENG_FILENAME,
                CSV_CAPTION_LAS_FILENAME,
            ] + [
                header
                for header in input_headers
                if header not in {CSV_MOV_FILENAME, CSV_CAPTION_ENG_FILENAME, CSV_CAPTION_LAS_FILENAME}
            ]
        else:
            output_headers = [CSV_FILENAME] + [header for header in input_headers if header != CSV_FILENAME]
        generated_rows: list[dict[str, str]] = []
        generated_count = 0
        saw_plus_warning = False

        for index, row in enumerate(rows, start=2):
            task_fields = self._row_to_task_fields(row)
            output_row = {header: row.get(header, "") for header in output_headers}
            try:
                main_filename = build_filename(selected_task, task_fields)
                if companion_caption_task is not None:
                    companion_captions = self._companion_caption_outputs(selected_task, task_fields)
                    if companion_captions is None:
                        raise ValueError("Missing companion caption configuration.")
                    output_row[CSV_MOV_FILENAME] = main_filename
                    output_row[CSV_CAPTION_ENG_FILENAME] = companion_captions[0]
                    output_row[CSV_CAPTION_LAS_FILENAME] = companion_captions[1]
                else:
                    output_row[CSV_FILENAME] = main_filename
            except ValueError as error:
                self.status_var.set(f"CSV row {index} ({selected_task}): {error}")
                return
            generated_rows.append(output_row)
            generated_count += 1
            saw_plus_warning = saw_plus_warning or plus_warning_needed(task_fields)

        default_name = f"{self.batch_csv_path.stem}_named.csv"
        save_path = filedialog.asksaveasfilename(
            title="Save Output CSV",
            defaultextension=".csv",
            initialfile=default_name,
            initialdir=str(self.batch_csv_path.parent),
            filetypes=[("CSV files", "*.csv")],
        )
        if not save_path:
            self.status_var.set("Output save canceled.")
            return

        with open(save_path, "w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=output_headers)
            writer.writeheader()
            writer.writerows(generated_rows)

        self.batch_output_path_var.set(save_path)
        if saw_plus_warning:
            self.status_var.set(f'Generated {generated_count} filename(s) into a new CSV. {PLUS_WARNING_MESSAGE}')
        else:
            self.status_var.set(f"Generated {generated_count} filename(s) into a new CSV.")

    def _copy_single(self) -> None:
        values = [
            self.single_output_vars["video"].get().strip(),
            self.single_output_vars["caption_eng"].get().strip(),
            self.single_output_vars["caption_las"].get().strip(),
        ]
        payload = "\n".join(value for value in values if value)
        if not payload:
            messagebox.showwarning(APP_TITLE, "No filename to copy.")
            return
        self.root.clipboard_clear()
        self.root.clipboard_append(payload)
        self.status_var.set("Copied generated names.")

    def _clear_single_fields(self) -> None:
        for field, variable in self.field_vars.items():
            variable.set(DEFAULT_VALUES[field])
        self._subtitle_type_manual_override = False
        self._apply_subtitle_default(force=True)
        self._clear_single_outputs()
        self.status_var.set("Single-item fields cleared.")


def main() -> None:
    root = tk.Tk()
    NebFilenameAssistant(root)
    root.mainloop()


if __name__ == "__main__":
    main()
