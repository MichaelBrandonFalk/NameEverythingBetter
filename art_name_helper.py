"""Simple desktop helper for art filename generation."""

from __future__ import annotations

import csv
import re
import unicodedata
from pathlib import Path
from typing import Callable
import tkinter as tk
from openpyxl import Workbook
from tkinter import filedialog, messagebox, ttk

APP_TITLE = "Verso - Art Naming Tool"
WINDOW_WIDTH = 940
WINDOW_HEIGHT = 720
MODE_REQUIRED_SET = "set"
MODE_SINGLE = "single"
MODE_MULTI = "multi"

FIELD_TITLE = "title"
FIELD_LANGUAGE = "language"
FIELD_SEASON = "season"
FIELD_EPISODE = "episode"
FIELD_YEAR = "year"
FIELD_INTERVIEWEES = "interviewees"
FIELD_EXTRA_USAGE = "extra_usage"
FIELD_ART_TAG = "art_tag"
FIELD_ASPECT_RATIO = "aspect_ratio"
FIELD_DIMENSIONS = "dimensions"

FIELD_LABELS = {
    FIELD_TITLE: "Title *",
    FIELD_LANGUAGE: "Language *",
    FIELD_SEASON: "Season *",
    FIELD_EPISODE: "Episode *",
    FIELD_YEAR: "Year *",
    FIELD_INTERVIEWEES: "Interviewee(s) *",
    FIELD_EXTRA_USAGE: "Extra Type *",
    FIELD_ART_TAG: "Art Tag *",
    FIELD_ASPECT_RATIO: "Aspect Ratio *",
    FIELD_DIMENSIONS: "Dimensions *",
}
TASK_FIELD_LABEL_OVERRIDES: dict[str, dict[str, str]] = {
    "Season Placeholder": {
        FIELD_TITLE: "Series Title *",
    },
    "Episode": {
        FIELD_TITLE: "Series Title *",
    },
    "Virtual Screening Episode": {
        FIELD_TITLE: "Series Title *",
    },
}
LANGUAGE_OPTIONS = ("English", "Spanish")

ART_TAG_OPTIONS = (
    "ca - Cover Art",
    "bg - Background Art",
    "tt - Title Treatment",
)
ART_TAG_TO_CODE = {
    "ca - Cover Art": "ca",
    "bg - Background Art": "bg",
    "tt - Title Treatment": "tt",
    "ca": "ca",
    "bg": "bg",
    "tt": "tt",
}
ART_TAG_CODE_TO_LABEL = {
    "ca": "ca - Cover Art",
    "bg": "bg - Background Art",
    "tt": "tt - Title Treatment",
}
TASK_ART_TAG_CODES: dict[str, tuple[str, ...]] = {
    "Movie": ("ca", "bg", "tt"),
    "Series": ("ca", "bg", "tt"),
    "Season Placeholder": ("ca", "bg"),
    "Episode": ("bg",),
    "Original Premium Series (Yearly)": ("bg",),
    "Exclusive Conversation (Yearly)": ("bg",),
    "Virtual Screening": ("bg",),
    "Virtual Screening Episode": ("bg",),
    "Trailer": ("bg",),
    "Extras": ("bg",),
    "Carousel": ("ca",),
}
EXTRA_USAGE_OPTIONS = (
    "Behind the Scenes / Making Of",
    "Interviews (Cast/Crew)",
    "Deleted Scenes",
    "Bloopers / Alternate Takes",
    "Music Videos",
    "Promotional Clips",
)
EXTRA_USAGE_TO_PREFIX = {
    "Behind the Scenes / Making Of": "bts",
    "Interviews (Cast/Crew)": "int",
    "Deleted Scenes": "del",
    "Bloopers / Alternate Takes": "alt",
    "Music Videos": "mus",
    "Promotional Clips": "clp",
}
APPROVED_ART_SIZES: dict[str, dict[str, tuple[str, ...]]] = {
    "ca": {
        "7x3": ("2450x1100",),
        "16x9": ("3840x2160", "1920x1080"),
        "4x3": ("3200x2400", "2560x1920"),
        "3x4": ("2400x3200", "1920x2560"),
        "2x3": ("2000x3000", "1600x2400"),
        "1x1": ("3000x3000",),
    },
    "bg": {
        "16x9": ("3840x2160", "2560x1440", "1920x1080"),
        "2x3": ("2000x3000",),
        "7x3": ("2450x1100",),
        "4x3": ("1440x1080",),
    },
    "tt": {
        "9x5": ("1800x1000",),
    },
}
APPROVED_ASPECT_RATIO_DIMENSIONS: dict[str, tuple[str, ...]] = {
    "7x3": ("2450x1100",),
    "16x9": ("3840x2160", "2560x1440", "1920x1080"),
    "4x3": ("3200x2400", "2560x1920", "1440x1080"),
    "3x4": ("2400x3200", "1920x2560"),
    "2x3": ("2000x3000", "1600x2400"),
    "1x1": ("3000x3000",),
    "9x5": ("1800x1000",),
}
ASPECT_RATIO_OPTIONS = tuple(
    aspect_ratio
    for aspect_ratio in ("7x3", "16x9", "4x3", "3x4", "2x3", "1x1", "9x5")
    if any(aspect_ratio in sizes for sizes in APPROVED_ART_SIZES.values())
)
DIMENSION_OPTIONS = tuple(
    dimension
    for dimension in (
        "2450x1100",
        "3840x2160",
        "3200x2400",
        "1920x1080",
        "2400x3200",
        "2000x3000",
        "1600x2400",
        "1920x2560",
        "3000x3000",
        "2560x1920",
        "2560x1440",
        "1800x1000",
        "1440x1080",
    )
    if any(dimension in aspect_sizes for sizes in APPROVED_ART_SIZES.values() for aspect_sizes in sizes.values())
)

TASKS: dict[str, tuple[str, ...]] = {
    "Movie": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_ART_TAG, FIELD_ASPECT_RATIO, FIELD_DIMENSIONS),
    "Series": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_ART_TAG, FIELD_ASPECT_RATIO, FIELD_DIMENSIONS),
    "Season Placeholder": (FIELD_TITLE, FIELD_SEASON, FIELD_LANGUAGE, FIELD_ART_TAG, FIELD_ASPECT_RATIO, FIELD_DIMENSIONS),
    "Episode": (FIELD_TITLE, FIELD_SEASON, FIELD_EPISODE, FIELD_LANGUAGE, FIELD_ART_TAG, FIELD_ASPECT_RATIO, FIELD_DIMENSIONS),
    "Original Premium Series (Yearly)": (FIELD_TITLE, FIELD_YEAR, FIELD_EPISODE, FIELD_LANGUAGE, FIELD_ART_TAG, FIELD_ASPECT_RATIO, FIELD_DIMENSIONS),
    "Exclusive Conversation (Yearly)": (FIELD_YEAR, FIELD_EPISODE, FIELD_INTERVIEWEES, FIELD_LANGUAGE, FIELD_ART_TAG, FIELD_ASPECT_RATIO, FIELD_DIMENSIONS),
    "Virtual Screening": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_ART_TAG, FIELD_ASPECT_RATIO, FIELD_DIMENSIONS),
    "Virtual Screening Episode": (FIELD_TITLE, FIELD_SEASON, FIELD_EPISODE, FIELD_LANGUAGE, FIELD_ART_TAG, FIELD_ASPECT_RATIO, FIELD_DIMENSIONS),
    "Trailer": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_ART_TAG, FIELD_ASPECT_RATIO, FIELD_DIMENSIONS),
    "Extras": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_EXTRA_USAGE, FIELD_ART_TAG, FIELD_ASPECT_RATIO, FIELD_DIMENSIONS),
    "Carousel": (FIELD_TITLE, FIELD_LANGUAGE, FIELD_ART_TAG, FIELD_ASPECT_RATIO, FIELD_DIMENSIONS),
}
ART_DETAIL_FIELDS = {FIELD_ART_TAG, FIELD_ASPECT_RATIO, FIELD_DIMENSIONS}

DEFAULT_VALUES = {
    FIELD_TITLE: "",
    FIELD_LANGUAGE: "English",
    FIELD_SEASON: "02",
    FIELD_EPISODE: "05",
    FIELD_YEAR: "2025",
    FIELD_INTERVIEWEES: "",
    FIELD_EXTRA_USAGE: "Behind the Scenes / Making Of",
    FIELD_ART_TAG: "bg - Background Art",
    FIELD_ASPECT_RATIO: "16x9",
    FIELD_DIMENSIONS: "1920x1080",
}

CSV_FILENAME = "filename"
CSV_TITLE = "title"
CSV_LANGUAGE = "language"
CSV_SEASON = "season"
CSV_EPISODE = "episode"
CSV_YEAR = "year"
CSV_INTERVIEWEES = "interviewees"
CSV_EXTRA_USAGE = "extra_usage"
CSV_ART_TAG = "art_tag"
CSV_ASPECT_RATIO = "aspect_ratio"
CSV_DIMENSIONS = "dimensions"

CSV_HEADER_TO_FIELD = {
    CSV_TITLE: FIELD_TITLE,
    CSV_LANGUAGE: FIELD_LANGUAGE,
    CSV_SEASON: FIELD_SEASON,
    CSV_EPISODE: FIELD_EPISODE,
    CSV_YEAR: FIELD_YEAR,
    CSV_INTERVIEWEES: FIELD_INTERVIEWEES,
    CSV_EXTRA_USAGE: FIELD_EXTRA_USAGE,
    CSV_ART_TAG: FIELD_ART_TAG,
    CSV_ASPECT_RATIO: FIELD_ASPECT_RATIO,
    CSV_DIMENSIONS: FIELD_DIMENSIONS,
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
    lowered = re.sub(r"([a-z0-9])\.\.\.(?=[a-z0-9])", r"\1_", lowered)
    lowered = lowered.replace("·", "")
    lowered = lowered.replace("*", "")
    lowered = lowered.replace("!", "")
    lowered = lowered.replace(".", "")
    normalized = unicodedata.normalize("NFKD", lowered)
    without_accents = "".join(char for char in normalized if not unicodedata.combining(char))
    slug = SLUG_SAFE_PATTERN.sub("_", without_accents)
    return re.sub(r"_+", "_", slug).strip("_")


def plus_warning_needed(raw_fields: dict[str, str]) -> bool:
    return any("+" in raw_fields.get(field, "") for field in PLUS_WARNING_FIELDS)


def normalize_title(value: str) -> str:
    title = slugify(value)
    if not title:
        raise ValueError("Title is required.")
    return title


def normalize_language(value: str) -> str:
    raw = value.strip().lower()
    if raw in {"", "english", "eng"}:
        return "english"
    if raw in {"spanish", "las"}:
        return "spanish"
    raise ValueError("Language must be English or Spanish.")


def language_suffix(value: str) -> str:
    return "las" if normalize_language(value) == "spanish" else "eng"


def normalize_season(value: str) -> str:
    raw = value.strip().lower()
    if raw.startswith("s"):
        raw = raw[1:]
    if not raw.isdigit() or len(raw) != 2:
        raise ValueError("Season must be 2 digits, for example 02.")
    return f"s{raw}"


def normalize_episode(value: str) -> str:
    raw = value.strip().lower()
    if raw.startswith("e"):
        raw = raw[1:]
    if not raw.isdigit() or len(raw) != 2:
        raise ValueError("Episode must be 2 digits, for example 05.")
    return f"e{raw}"


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


def normalize_extra_usage(value: str) -> str:
    usage = value.strip()
    extra_prefix = EXTRA_USAGE_TO_PREFIX.get(usage)
    if not extra_prefix:
        raise ValueError("Choose an Extra Type from the dropdown.")
    return extra_prefix


def normalize_art_tag(value: str) -> str:
    art_tag = ART_TAG_TO_CODE.get(value.strip(), "")
    if art_tag not in {"ca", "bg", "tt"}:
        raise ValueError("Art Tag must be ca, bg, or tt.")
    return art_tag


def allowed_art_tag_codes(task: str) -> tuple[str, ...]:
    return TASK_ART_TAG_CODES.get(task, ("ca", "bg", "tt"))


def allowed_art_tag_labels(task: str) -> tuple[str, ...]:
    return tuple(ART_TAG_CODE_TO_LABEL[code] for code in allowed_art_tag_codes(task))


def allowed_aspect_ratios(art_tag: str) -> tuple[str, ...]:
    return tuple(APPROVED_ART_SIZES.get(art_tag, {}).keys())


def allowed_dimensions(aspect_ratio: str) -> tuple[str, ...]:
    return APPROVED_ASPECT_RATIO_DIMENSIONS.get(aspect_ratio, ())


def normalize_aspect_ratio(value: str, art_tag: str | None = None) -> str:
    aspect_ratio = value.strip().lower()
    if aspect_ratio not in {item.lower() for item in ASPECT_RATIO_OPTIONS}:
        raise ValueError("Choose an Aspect Ratio from the dropdown.")
    if art_tag and aspect_ratio not in allowed_aspect_ratios(art_tag):
        raise ValueError("Choose an approved Aspect Ratio for the selected Art Tag.")
    return aspect_ratio


def normalize_dimensions(value: str, aspect_ratio: str | None = None) -> str:
    dimensions = value.strip().lower()
    if not re.fullmatch(r"\d+x\d+", dimensions):
        raise ValueError("Dimensions must look like 1920x1080.")
    if aspect_ratio and dimensions not in allowed_dimensions(aspect_ratio):
        raise ValueError("Choose an approved Dimensions value for the selected Aspect Ratio.")
    return dimensions


def extension_for_art_tag(art_tag: str) -> str:
    return "png" if art_tag == "tt" else "jpg"


def required_art_fields(task: str) -> tuple[str, ...]:
    return tuple(field for field in TASKS[task] if field not in ART_DETAIL_FIELDS)


def required_art_specs(task: str) -> tuple[tuple[str, str, str], ...]:
    specs: list[tuple[str, str, str]] = []
    for art_tag in allowed_art_tag_codes(task):
        for aspect_ratio, dimensions in APPROVED_ART_SIZES[art_tag].items():
            specs.append((art_tag, aspect_ratio, dimensions[0]))
    return tuple(specs)


def build_required_filenames(task: str, raw_fields: dict[str, str]) -> tuple[str, ...]:
    filenames: list[str] = []
    for art_tag, aspect_ratio, dimensions in required_art_specs(task):
        item_fields = dict(raw_fields)
        item_fields[FIELD_ART_TAG] = ART_TAG_CODE_TO_LABEL[art_tag]
        item_fields[FIELD_ASPECT_RATIO] = aspect_ratio
        item_fields[FIELD_DIMENSIONS] = dimensions
        filenames.append(build_filename(task, item_fields))
    return tuple(filenames)


def build_filename(task: str, raw_fields: dict[str, str]) -> str:
    art_tag = normalize_art_tag(raw_fields.get(FIELD_ART_TAG, ""))
    if art_tag not in allowed_art_tag_codes(task):
        raise ValueError("Choose an allowed Art Tag for the selected art type.")
    aspect_ratio = normalize_aspect_ratio(raw_fields.get(FIELD_ASPECT_RATIO, ""), art_tag)
    dimensions = normalize_dimensions(raw_fields.get(FIELD_DIMENSIONS, ""), aspect_ratio)
    extension = extension_for_art_tag(art_tag)
    language_code = language_suffix(raw_fields.get(FIELD_LANGUAGE, ""))
    language_segment = f"_{language_code}" if language_code else ""

    if task == "Movie":
        title = normalize_title(raw_fields.get(FIELD_TITLE, ""))
        return f"{title}{language_segment}_{art_tag}_{aspect_ratio}_{dimensions}.{extension}"

    if task == "Series":
        title = normalize_title(raw_fields.get(FIELD_TITLE, ""))
        return f"{title}{language_segment}_{art_tag}_{aspect_ratio}_{dimensions}.{extension}"

    if task == "Season Placeholder":
        title = normalize_title(raw_fields.get(FIELD_TITLE, ""))
        season = normalize_season(raw_fields.get(FIELD_SEASON, ""))
        return f"{title}_{season}{language_segment}_{art_tag}_{aspect_ratio}_{dimensions}.{extension}"

    if task == "Episode":
        title = normalize_title(raw_fields.get(FIELD_TITLE, ""))
        season = normalize_season(raw_fields.get(FIELD_SEASON, ""))
        episode = normalize_episode(raw_fields.get(FIELD_EPISODE, ""))
        return f"{title}_{season}_{episode}{language_segment}_{art_tag}_{aspect_ratio}_{dimensions}.{extension}"

    if task == "Original Premium Series (Yearly)":
        title = normalize_title(raw_fields.get(FIELD_TITLE, ""))
        year = normalize_year(raw_fields.get(FIELD_YEAR, ""))
        episode = normalize_episode(raw_fields.get(FIELD_EPISODE, ""))
        return f"{title}_s{year}_{episode}{language_segment}_{art_tag}_{aspect_ratio}_{dimensions}.{extension}"

    if task == "Exclusive Conversation (Yearly)":
        year = normalize_year(raw_fields.get(FIELD_YEAR, ""))
        episode = normalize_episode(raw_fields.get(FIELD_EPISODE, ""))
        interviewees = normalize_interviewees(raw_fields.get(FIELD_INTERVIEWEES, ""))
        return f"exclusive_conversations_s{year}_{episode}_{interviewees}{language_segment}_{art_tag}_{aspect_ratio}_{dimensions}.{extension}"

    if task == "Virtual Screening":
        title = normalize_title(raw_fields.get(FIELD_TITLE, ""))
        return f"{title}_virtual_screening{language_segment}_{art_tag}_{aspect_ratio}_{dimensions}.{extension}"

    if task == "Virtual Screening Episode":
        title = normalize_title(raw_fields.get(FIELD_TITLE, ""))
        season = normalize_season(raw_fields.get(FIELD_SEASON, ""))
        episode = normalize_episode(raw_fields.get(FIELD_EPISODE, ""))
        return f"{title}_{season}_{episode}_virtual_screening{language_segment}_{art_tag}_{aspect_ratio}_{dimensions}.{extension}"

    if task == "Trailer":
        title = normalize_title(raw_fields.get(FIELD_TITLE, ""))
        return f"{title}_trailer{language_segment}_{art_tag}_{aspect_ratio}_{dimensions}.{extension}"

    if task == "Extras":
        title = normalize_title(raw_fields.get(FIELD_TITLE, ""))
        extra_prefix = normalize_extra_usage(raw_fields.get(FIELD_EXTRA_USAGE, ""))
        return f"{title}_{extra_prefix}{language_segment}_{art_tag}_{aspect_ratio}_{dimensions}.{extension}"

    if task == "Carousel":
        title = normalize_title(raw_fields.get(FIELD_TITLE, ""))
        return f"{title}_carousel{language_segment}_{art_tag}_{aspect_ratio}_{dimensions}.{extension}"

    raise ValueError("Unsupported art type.")


class ArtNameHelperApp:
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
        self.single_output_lines: list[str] = []
        self.batch_input_path_var = tk.StringVar(value="No CSV selected.")
        self.batch_output_path_var = tk.StringVar(value="")
        self.multi_help_var = tk.StringVar(value=self._multi_help_text(self.multi_task_var.get()))

        self.field_vars = {field: tk.StringVar(value=default) for field, default in DEFAULT_VALUES.items()}
        self.field_rows: dict[str, ttk.Frame] = {}
        self.field_labels: dict[str, ttk.Label] = {}
        self.field_combos: dict[str, ttk.Combobox] = {}
        self.batch_csv_path: Path | None = None

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
            text="Hi, I'm Verso. Would you like the full required art set, one thing at a time, or multiple things?",
            font=("", 13, "bold"),
            wraplength=760,
            justify="center",
        )
        welcome_label.pack(pady=(120, 20))

        button_row = ttk.Frame(self.welcome_frame)
        button_row.pack()
        ttk.Button(
            button_row,
            text="Full Required Art Set",
            command=lambda: self._choose_mode(MODE_REQUIRED_SET),
            width=26,
        ).pack(side="left", padx=8)
        ttk.Button(
            button_row,
            text="One Thing At A Time",
            command=lambda: self._choose_mode(MODE_SINGLE),
            width=24,
        ).pack(side="left", padx=8)
        ttk.Button(
            button_row,
            text="Multiple Things",
            command=lambda: self._choose_mode(MODE_MULTI),
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
        ttk.Label(self.task_row, text="This art is for :", width=18).pack(side="left")
        task_combo = ttk.Combobox(
            self.task_row,
            textvariable=self.task_var,
            values=tuple(TASKS.keys()),
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
        self.generate_single_button = ttk.Button(single_buttons, text="Generate Names", command=self._generate_single)
        self.generate_single_button.pack(side="right")
        ttk.Button(single_buttons, text="Clear", command=self._clear_single_fields).pack(side="right", padx=(0, 8))

        self.single_output_frame = ttk.LabelFrame(self.single_frame, text="Generated Names")
        self.single_output_frame.pack(fill="both", expand=True)
        self.single_output_frame.columnconfigure(0, weight=1)
        self.single_output_frame.rowconfigure(0, weight=1)
        self.single_output_text = tk.Text(self.single_output_frame, height=12, wrap="word")
        self.single_output_text.grid(row=0, column=0, sticky="nsew", padx=(10, 8), pady=10)
        self.single_output_text.configure(state="disabled")
        output_button_row = ttk.Frame(self.single_output_frame)
        output_button_row.grid(row=1, column=0, sticky="e", padx=(10, 10), pady=(0, 10))
        ttk.Button(output_button_row, text="Download Spreadsheet", command=self._download_single_output).pack(side="right")
        ttk.Button(output_button_row, text="Copy All", command=self._copy_single).pack(side="right", padx=(0, 8))

        self.multi_frame = ttk.Frame(self.builder_frame)
        ttk.Label(
            self.multi_frame,
            text="Choose one art type, download its CSV template, then upload a batch for that type.",
            wraplength=840,
            justify="left",
        ).pack(anchor="w", pady=(0, 8))

        bulk_type_frame = ttk.LabelFrame(self.multi_frame, text="1. Choose The Art Type")
        bulk_type_frame.pack(fill="x", pady=(0, 10))
        bulk_type_frame.columnconfigure(0, weight=1)
        ttk.Combobox(
            bulk_type_frame,
            textvariable=self.multi_task_var,
            values=tuple(TASKS.keys()),
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
            self.single_fields_frame,
            FIELD_LANGUAGE,
            FIELD_LABELS[FIELD_LANGUAGE],
            self.field_vars[FIELD_LANGUAGE],
            LANGUAGE_OPTIONS,
        )
        self.field_rows[FIELD_SEASON] = self._add_entry_row(self.single_fields_frame, FIELD_LABELS[FIELD_SEASON], self.field_vars[FIELD_SEASON], width=12)
        self.field_rows[FIELD_EPISODE] = self._add_entry_row(self.single_fields_frame, FIELD_LABELS[FIELD_EPISODE], self.field_vars[FIELD_EPISODE], width=12)
        self.field_rows[FIELD_YEAR] = self._add_entry_row(self.single_fields_frame, FIELD_LABELS[FIELD_YEAR], self.field_vars[FIELD_YEAR], width=12)
        self.field_rows[FIELD_INTERVIEWEES] = self._add_entry_row(self.single_fields_frame, FIELD_LABELS[FIELD_INTERVIEWEES], self.field_vars[FIELD_INTERVIEWEES])
        self.field_rows[FIELD_EXTRA_USAGE] = self._add_combo_row(
            self.single_fields_frame,
            FIELD_EXTRA_USAGE,
            FIELD_LABELS[FIELD_EXTRA_USAGE],
            self.field_vars[FIELD_EXTRA_USAGE],
            EXTRA_USAGE_OPTIONS,
        )
        self.field_rows[FIELD_ART_TAG] = self._add_combo_row(
            self.single_fields_frame,
            FIELD_ART_TAG,
            FIELD_LABELS[FIELD_ART_TAG],
            self.field_vars[FIELD_ART_TAG],
            ART_TAG_OPTIONS,
        )
        self.field_rows[FIELD_ASPECT_RATIO] = self._add_combo_row(
            self.single_fields_frame,
            FIELD_ASPECT_RATIO,
            FIELD_LABELS[FIELD_ASPECT_RATIO],
            self.field_vars[FIELD_ASPECT_RATIO],
            ASPECT_RATIO_OPTIONS,
        )
        self.field_rows[FIELD_DIMENSIONS] = self._add_combo_row(
            self.single_fields_frame,
            FIELD_DIMENSIONS,
            FIELD_LABELS[FIELD_DIMENSIONS],
            self.field_vars[FIELD_DIMENSIONS],
            DIMENSION_OPTIONS,
        )

    def _add_entry_row(self, parent: ttk.Widget, label: str, variable: tk.StringVar, width: int = 40) -> ttk.Frame:
        row = ttk.Frame(parent)
        label_widget = ttk.Label(row, text=label, width=18)
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
        field_name: str,
        label: str,
        variable: tk.StringVar,
        values: tuple[str, ...],
    ) -> ttk.Frame:
        row = ttk.Frame(parent)
        label_widget = ttk.Label(row, text=label, width=18)
        label_widget.pack(side="left")
        combo = ttk.Combobox(row, textvariable=variable, values=values, state="readonly", width=30)
        combo.pack(side="left")
        for field_name, field_label in FIELD_LABELS.items():
            if field_label == label:
                self.field_labels[field_name] = label_widget
                break
        self.field_combos[field_name] = combo
        return row

    def _bind_field_logic(self) -> None:
        self.multi_task_var.trace_add("write", self._on_multi_task_change)
        self.field_vars[FIELD_ART_TAG].trace_add("write", self._on_single_size_driver_change)
        self.field_vars[FIELD_ASPECT_RATIO].trace_add("write", self._on_single_size_driver_change)

    def _on_single_size_driver_change(self, *_args: object) -> None:
        self._refresh_size_dropdowns()

    def _refresh_size_dropdowns(self) -> None:
        art_tag = ART_TAG_TO_CODE.get(self.field_vars[FIELD_ART_TAG].get().strip(), "")
        aspect_combo = self.field_combos.get(FIELD_ASPECT_RATIO)
        dimension_combo = self.field_combos.get(FIELD_DIMENSIONS)
        if not art_tag or aspect_combo is None or dimension_combo is None:
            return

        valid_aspects = allowed_aspect_ratios(art_tag)
        aspect_combo["values"] = valid_aspects
        if self.field_vars[FIELD_ASPECT_RATIO].get() not in valid_aspects:
            self.field_vars[FIELD_ASPECT_RATIO].set(valid_aspects[0])

        valid_dimensions = allowed_dimensions(self.field_vars[FIELD_ASPECT_RATIO].get())
        dimension_combo["values"] = valid_dimensions
        if self.field_vars[FIELD_DIMENSIONS].get() not in valid_dimensions:
            self.field_vars[FIELD_DIMENSIONS].set(valid_dimensions[0])

    def _refresh_art_tag_dropdown(self) -> None:
        if self.mode_var.get() == "multi":
            task_name = self.multi_task_var.get()
        else:
            task_name = self.task_var.get()

        art_tag_combo = self.field_combos.get(FIELD_ART_TAG)
        if art_tag_combo is None:
            return

        valid_labels = allowed_art_tag_labels(task_name)
        art_tag_combo["values"] = valid_labels
        if self.field_vars[FIELD_ART_TAG].get() not in valid_labels:
            self.field_vars[FIELD_ART_TAG].set(valid_labels[0])

    def _choose_mode(self, mode: str) -> None:
        self.mode_var.set(mode)
        self.welcome_frame.pack_forget()
        self.builder_frame.pack(fill="both", expand=True)
        self._refresh_task_ui()
        if mode == MODE_MULTI:
            self.multi_help_var.set(self._multi_help_text(self.multi_task_var.get()))
            self.status_var.set("Choose one art type, then download the custom template.")
        elif mode == MODE_SINGLE:
            self.status_var.set("Fill required fields and click Generate Filename.")
        else:
            self.status_var.set("Fill required fields and click Generate Names.")

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
        if self.mode_var.get() == MODE_MULTI:
            self.mode_prompt_label.config(text="Great, let's do multiple art filenames.")
            self.task_row.pack_forget()
            self.single_frame.pack_forget()
            self.multi_frame.pack(fill="both", expand=True, pady=(0, 8))
        else:
            task = self.task_var.get()
            if self.mode_var.get() == MODE_SINGLE:
                required_fields = TASKS[task]
                self.mode_prompt_label.config(text="Great, which art filename do you need?")
                self.single_output_frame.config(text="Filename")
                self.generate_single_button.config(text="Generate Filename")
            else:
                required_fields = required_art_fields(task)
                self.mode_prompt_label.config(text="Great, which art set do you need?")
                self.single_output_frame.config(text="Required Art Names")
                self.generate_single_button.config(text="Generate Names")
            self.task_row.pack(fill="x", pady=(0, 10))
            self.multi_frame.pack_forget()
            self.single_frame.pack(fill="both", expand=True, pady=(0, 10))
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
        if self.mode_var.get() == MODE_SINGLE:
            self._refresh_art_tag_dropdown()
            self._refresh_size_dropdowns()
        self._set_single_output([])

    def _set_single_output(self, lines: list[str] | tuple[str, ...]) -> None:
        self.single_output_lines = list(lines)
        self.single_output_text.configure(state="normal")
        self.single_output_text.delete("1.0", "end")
        if self.single_output_lines:
            self.single_output_text.insert("1.0", "\n".join(self.single_output_lines))
        self.single_output_text.configure(state="disabled")

    def _single_output_payload(self) -> str:
        return "\n".join(self.single_output_lines)

    def _download_single_output(self) -> None:
        payload = [line for line in self.single_output_lines if line.strip()]
        if not payload:
            messagebox.showwarning(APP_TITLE, "No names to download.")
            return
        task_slug = slugify(self.task_var.get()) or "art_names"
        title_slug = slugify(self.field_vars[FIELD_TITLE].get()) or "art_names"
        default_name = f"{title_slug}_{task_slug}_names.xlsx"
        path = filedialog.asksaveasfilename(
            title="Save Art Name Spreadsheet",
            defaultextension=".xlsx",
            initialfile=default_name,
            filetypes=[("Excel files", "*.xlsx")],
        )
        if not path:
            self.status_var.set("Download canceled.")
            return
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = "Art Names"
        sheet["A1"] = "filename"
        for index, line in enumerate(payload, start=2):
            sheet.cell(row=index, column=1, value=line)
        sheet.column_dimensions["A"].width = max(18, min(120, max(len("filename"), *(len(line) for line in payload)) + 2))
        workbook.save(path)
        self.status_var.set("Art name spreadsheet saved.")

    def _multi_fields_for_task(self, task_name: str) -> list[str]:
        return list(TASKS[task_name])

    def _csv_headers_for_task(self, task_name: str) -> list[str]:
        reverse_map = {field: header for header, field in CSV_HEADER_TO_FIELD.items()}
        return [reverse_map[field] for field in self._multi_fields_for_task(task_name)]

    def _on_multi_task_change(self, *_args: object) -> None:
        self.multi_help_var.set(self._multi_help_text(self.multi_task_var.get()))
        if self.mode_var.get() == "multi":
            self.status_var.set("Download the template for this art type, then upload your CSV.")

    def _multi_help_text(self, task_name: str) -> str:
        headers = self._csv_headers_for_task(task_name)
        allowed_tags = ", ".join(allowed_art_tag_codes(task_name))
        lines = [
            f"Selected type: {task_name}",
            f"CSV headers for this template: {', '.join(headers)}",
            "The output CSV will add a single `filename` column at the front.",
            f"Valid art_tag values for this type: {allowed_tags}",
            "Language accepts English or Spanish. English adds `_eng`. Spanish adds `_las`.",
            "`tt` always outputs `.png`. `ca` and `bg` output `.jpg`.",
            "Dimensions must match the selected Aspect Ratio.",
        ]
        if task_name in {"Season Placeholder", "Episode", "Virtual Screening Episode"}:
            lines.append("For this art type, `title` should be the series title.")
        return "\n".join(lines)

    def _raw_fields_for_task(self) -> dict[str, str]:
        if self.mode_var.get() == MODE_SINGLE:
            fields = TASKS[self.task_var.get()]
        else:
            fields = required_art_fields(self.task_var.get())
        return {field: self.field_vars[field].get().strip() for field in fields}

    def _generate_single(self) -> None:
        task = self.task_var.get()
        raw_fields = self._raw_fields_for_task()
        try:
            if self.mode_var.get() == MODE_SINGLE:
                output_lines = [build_filename(task, raw_fields)]
            else:
                output_lines = list(build_required_filenames(task, raw_fields))
        except ValueError as error:
            self._set_single_output([])
            self.status_var.set(str(error))
            return
        self._set_single_output(output_lines)
        if plus_warning_needed(raw_fields):
            self.status_var.set(f'Names generated. {PLUS_WARNING_MESSAGE}')
        else:
            self.status_var.set("Names generated.")

    def _template_example_rows(self, headers: list[str], task_name: str) -> list[dict[str, str]]:
        default_art_tag = allowed_art_tag_codes(task_name)[0]
        first_row = {
            CSV_TITLE: "wild like me",
            CSV_LANGUAGE: "English",
            CSV_SEASON: "02",
            CSV_EPISODE: "05",
            CSV_YEAR: "2025",
            CSV_INTERVIEWEES: "",
            CSV_EXTRA_USAGE: "Behind the Scenes / Making Of",
            CSV_ART_TAG: default_art_tag,
            CSV_ASPECT_RATIO: "16x9",
            CSV_DIMENSIONS: "1920x1080",
        }
        second_row = {
            CSV_TITLE: "wild like me",
            CSV_LANGUAGE: "Spanish",
            CSV_SEASON: "02",
            CSV_EPISODE: "05",
            CSV_YEAR: "2025",
            CSV_INTERVIEWEES: "",
            CSV_EXTRA_USAGE: "Deleted Scenes",
            CSV_ART_TAG: default_art_tag,
            CSV_ASPECT_RATIO: "16x9",
            CSV_DIMENSIONS: "3840x2160",
        }
        if task_name in {"Series", "Movie", "Virtual Screening", "Trailer", "Carousel"}:
            first_row[CSV_SEASON] = ""
            second_row[CSV_SEASON] = ""
            first_row[CSV_EPISODE] = ""
            second_row[CSV_EPISODE] = ""
        elif task_name == "Virtual Screening Episode":
            first_row[CSV_TITLE] = "when hope calls"
            second_row[CSV_TITLE] = "when hope calls"
            first_row[CSV_SEASON] = "03"
            second_row[CSV_SEASON] = "03"
            first_row[CSV_EPISODE] = "02"
            second_row[CSV_EPISODE] = "03"
            first_row[CSV_YEAR] = ""
            second_row[CSV_YEAR] = ""
            first_row[CSV_INTERVIEWEES] = ""
            second_row[CSV_INTERVIEWEES] = ""
            first_row[CSV_EXTRA_USAGE] = ""
            second_row[CSV_EXTRA_USAGE] = ""
            if task_name == "Series":
                first_row[CSV_TITLE] = "county rescue"
                second_row[CSV_TITLE] = "county rescue"
            elif task_name == "Virtual Screening":
                first_row[CSV_TITLE] = "wild like me"
                second_row[CSV_TITLE] = "wild like me"
            elif task_name == "Trailer":
                first_row[CSV_TITLE] = "gods not dead"
                second_row[CSV_TITLE] = "gods not dead"
            elif task_name == "Carousel":
                first_row[CSV_TITLE] = "county rescue"
                second_row[CSV_TITLE] = "county rescue"
                first_row[CSV_ASPECT_RATIO] = "7x3"
                second_row[CSV_ASPECT_RATIO] = "16x9"
                first_row[CSV_DIMENSIONS] = "2450x1100"
                second_row[CSV_DIMENSIONS] = "1920x1080"
        elif task_name == "Season Placeholder":
            first_row[CSV_TITLE] = "county rescue"
            second_row[CSV_TITLE] = "county rescue"
            first_row[CSV_EPISODE] = ""
            second_row[CSV_EPISODE] = ""
            first_row[CSV_YEAR] = ""
            second_row[CSV_YEAR] = ""
            first_row[CSV_INTERVIEWEES] = ""
            second_row[CSV_INTERVIEWEES] = ""
            first_row[CSV_EXTRA_USAGE] = ""
            second_row[CSV_EXTRA_USAGE] = ""
        elif task_name == "Episode":
            first_row[CSV_TITLE] = "county rescue"
            second_row[CSV_TITLE] = "county rescue"
            first_row[CSV_EPISODE] = "06"
            second_row[CSV_EPISODE] = "06"
            first_row[CSV_YEAR] = ""
            second_row[CSV_YEAR] = ""
            first_row[CSV_INTERVIEWEES] = ""
            second_row[CSV_INTERVIEWEES] = ""
            first_row[CSV_EXTRA_USAGE] = ""
            second_row[CSV_EXTRA_USAGE] = ""
        elif task_name == "Original Premium Series (Yearly)":
            first_row[CSV_TITLE] = "pure devotions"
            second_row[CSV_TITLE] = "pure devotions"
            first_row[CSV_SEASON] = ""
            second_row[CSV_SEASON] = ""
            first_row[CSV_INTERVIEWEES] = ""
            second_row[CSV_INTERVIEWEES] = ""
            first_row[CSV_EXTRA_USAGE] = ""
            second_row[CSV_EXTRA_USAGE] = ""
        elif task_name == "Exclusive Conversation (Yearly)":
            first_row[CSV_TITLE] = ""
            second_row[CSV_TITLE] = ""
            first_row[CSV_SEASON] = ""
            second_row[CSV_SEASON] = ""
            first_row[CSV_YEAR] = "2026"
            second_row[CSV_YEAR] = "2026"
            first_row[CSV_EPISODE] = "09"
            second_row[CSV_EPISODE] = "10"
            first_row[CSV_INTERVIEWEES] = "Anthony Hopkins"
            second_row[CSV_INTERVIEWEES] = "Viola Davis"
            first_row[CSV_EXTRA_USAGE] = ""
            second_row[CSV_EXTRA_USAGE] = ""
        elif task_name == "Extras":
            first_row[CSV_TITLE] = "gods not dead"
            second_row[CSV_TITLE] = "gods not dead"
            first_row[CSV_SEASON] = ""
            second_row[CSV_SEASON] = ""
            first_row[CSV_EPISODE] = ""
            second_row[CSV_EPISODE] = ""
            first_row[CSV_YEAR] = ""
            second_row[CSV_YEAR] = ""
            first_row[CSV_INTERVIEWEES] = ""
            second_row[CSV_INTERVIEWEES] = ""
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
        path = filedialog.askopenfilename(title="Choose Input CSV", filetypes=[("CSV files", "*.csv")])
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
        return {field: row.get(csv_header, "").strip() for csv_header, field in CSV_HEADER_TO_FIELD.items()}

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

        output_headers = [CSV_FILENAME] + [header for header in input_headers if header != CSV_FILENAME]
        generated_rows: list[dict[str, str]] = []
        saw_plus_warning = False
        for index, row in enumerate(rows, start=2):
            task_fields = self._row_to_task_fields(row)
            output_row = {header: row.get(header, "") for header in output_headers}
            try:
                output_row[CSV_FILENAME] = build_filename(selected_task, task_fields)
            except ValueError as error:
                self.status_var.set(f"CSV row {index} ({selected_task}): {error}")
                return
            generated_rows.append(output_row)
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
            self.status_var.set(f'Generated {len(generated_rows)} filename(s) into a new CSV. {PLUS_WARNING_MESSAGE}')
        else:
            self.status_var.set(f"Generated {len(generated_rows)} filename(s) into a new CSV.")

    def _copy_single(self) -> None:
        value = self._single_output_payload().strip()
        if not value:
            messagebox.showwarning(APP_TITLE, "No names to copy.")
            return
        self.root.clipboard_clear()
        self.root.clipboard_append(value)
        self.status_var.set("Copied generated names.")

    def _clear_single_fields(self) -> None:
        for field, variable in self.field_vars.items():
            variable.set(DEFAULT_VALUES[field])
        if self.mode_var.get() == MODE_SINGLE:
            self._refresh_art_tag_dropdown()
            self._refresh_size_dropdowns()
        self._set_single_output([])
        self.status_var.set("Single-item fields cleared.")


def main() -> None:
    root = tk.Tk()
    ArtNameHelperApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
