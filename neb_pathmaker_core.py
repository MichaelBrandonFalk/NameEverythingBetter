"""S3 path generation for NEB+PathMaker."""

from __future__ import annotations

import re

from axinom_name_builder import (
    DEFAULT_VALUES,
    FIELD_EPISODE,
    FIELD_EXTRA_USAGE,
    FIELD_LANGUAGE,
    FIELD_SEASON,
    FIELD_TITLE,
    FIELD_YEAR,
    LANGUAGE_OPTIONS,
    SINGLE_HIDDEN_TASKS,
    TASKS,
    slugify,
)

PATHMAKER_BUCKET = "gacm-axinom-staging"
FIELD_SKU = "sku"
PATHMAKER_SERIES_TASK = "Series"
PATHMAKER_DEFAULTS = {
    **DEFAULT_VALUES,
    FIELD_SKU: "",
}

PATHMAKER_EXTRA_USAGE_TO_PREFIX = {
    "Behind the Scenes / Making Of": "bts",
    "Interviews (Cast/Crew)": "int",
    "Deleted Scenes": "del",
    "Bloopers / Alternate Takes": "alt",
    "Promotional Clips": "clp",
}

PATHMAKER_TASK_FIELDS: dict[str, tuple[str, ...]] = {}
for task_name, task_definition in TASKS.items():
    PATHMAKER_TASK_FIELDS[task_name] = tuple(task_definition["fields"])  # type: ignore[index]
    if task_name == "Movie":
        PATHMAKER_TASK_FIELDS[PATHMAKER_SERIES_TASK] = (FIELD_TITLE, FIELD_LANGUAGE)

MOVIE_ROOT_TASKS = {
    "Movie",
    "Caption",
    "Dub Audio",
    "Virtual Screening",
    "Trailer",
    "Trailer Caption",
    "Extras",
}

SERIES_ROOT_TASKS = {
    PATHMAKER_SERIES_TASK,
    "Episode",
    "Episode Caption",
    "Original Premium Series (Yearly)",
    "Exclusive Conversation (Yearly)",
    "Virtual Screening Episode",
    "Virtual Screening Episode Caption",
}


def pathmaker_task_options() -> tuple[str, ...]:
    return tuple(task for task in PATHMAKER_TASK_FIELDS if task not in SINGLE_HIDDEN_TASKS)


def pathmaker_fields_for_task(task: str, *, for_path_only: bool = False) -> tuple[str, ...]:
    if task not in PATHMAKER_TASK_FIELDS:
        raise ValueError("Unsupported PathMaker task type.")
    fields = PATHMAKER_TASK_FIELDS[task]
    if for_path_only:
        return tuple(field for field in fields if field not in {"resolution", "house", "subtitle_type"}) + (FIELD_SKU,)
    return fields + (FIELD_SKU,)


def normalize_path_language(value: str) -> str:
    language = value.strip()
    if language not in LANGUAGE_OPTIONS:
        raise ValueError("Language must be English or Spanish.")
    return language


def normalize_sku(value: str) -> str:
    sku = value.strip().lower()
    if not sku:
        raise ValueError("SKU / Parent SKU is required.")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", sku):
        raise ValueError("SKU / Parent SKU can only use letters, numbers, and hyphens.")
    return sku


def normalize_season_folder(value: str) -> str:
    raw = value.strip().lower()
    if raw.startswith("s"):
        raw = raw[1:]
    if not raw.isdigit():
        raise ValueError("Season must be a number like 02.")
    return f"s{raw.zfill(2)}"


def normalize_year_season_folder(value: str) -> str:
    raw = value.strip().lower()
    if raw.startswith("s"):
        raw = raw[1:]
    if not re.fullmatch(r"\d{4}", raw):
        raise ValueError("Year must be four digits.")
    return f"s{raw}"


def normalize_episode_folder(value: str) -> str:
    raw = value.strip().lower()
    if raw.startswith("e"):
        raw = raw[1:]
    if not raw.isdigit():
        raise ValueError("Episode must be a number like 08.")
    return f"e{raw.zfill(2)}"


def title_slug(raw_fields: dict[str, str], label: str = "Title") -> str:
    slug = slugify(raw_fields.get(FIELD_TITLE, ""))
    if not slug:
        raise ValueError(f"{label} is required.")
    return slug


def localized_feature_folder(language: str) -> str:
    return "feature_las" if language == "Spanish" else "feature"


def localized_season_folder(season_folder: str, language: str) -> str:
    return f"{season_folder}_las" if language == "Spanish" else season_folder


def root_for_task(task: str) -> str:
    if task in MOVIE_ROOT_TASKS:
        return "movies"
    if task in SERIES_ROOT_TASKS:
        return "series"
    raise ValueError("Unsupported PathMaker task type.")


def project_slug_for_task(task: str, raw_fields: dict[str, str]) -> str:
    if task == "Exclusive Conversation (Yearly)":
        return "exclusive_conversation"
    label = "Series Title" if task == PATHMAKER_SERIES_TASK or "Episode" in task else "Title"
    return title_slug(raw_fields, label)


def project_folder(root: str, slug: str, sku: str) -> str:
    return f"s3://{PATHMAKER_BUCKET}/{root}/{slug}_{sku}"


def extra_folder(raw_fields: dict[str, str]) -> str:
    usage = raw_fields.get(FIELD_EXTRA_USAGE, "").strip()
    prefix = PATHMAKER_EXTRA_USAGE_TO_PREFIX.get(usage)
    if not prefix:
        raise ValueError("Choose an Extra Type supported by the source file structure doc.")
    usage_slug = slugify(usage)
    if not usage_slug:
        raise ValueError("Extra Type is required.")
    return f"{prefix}_{usage_slug}"


def build_pathmaker_path(task: str, raw_fields: dict[str, str]) -> str:
    if task not in PATHMAKER_TASK_FIELDS:
        raise ValueError("Unsupported PathMaker task type.")

    language = normalize_path_language(raw_fields.get(FIELD_LANGUAGE, PATHMAKER_DEFAULTS[FIELD_LANGUAGE]))
    sku = normalize_sku(raw_fields.get(FIELD_SKU, ""))
    root = root_for_task(task)
    project_slug = project_slug_for_task(task, raw_fields)
    base = project_folder(root, project_slug, sku)

    if task == PATHMAKER_SERIES_TASK:
        return f"{base}/"

    if task in {"Movie", "Caption", "Dub Audio"}:
        return f"{base}/{localized_feature_folder(language)}/"

    if task in {"Episode", "Episode Caption"}:
        season = localized_season_folder(normalize_season_folder(raw_fields.get(FIELD_SEASON, "")), language)
        episode = normalize_episode_folder(raw_fields.get(FIELD_EPISODE, ""))
        return f"{base}/{season}/{episode}/"

    if task in {"Original Premium Series (Yearly)", "Exclusive Conversation (Yearly)"}:
        season = localized_season_folder(normalize_year_season_folder(raw_fields.get(FIELD_YEAR, "")), language)
        episode = normalize_episode_folder(raw_fields.get(FIELD_EPISODE, ""))
        return f"{base}/{season}/{episode}/"

    if task == "Virtual Screening":
        return f"{base}/feature_virtual_screening/"

    if task in {"Virtual Screening Episode", "Virtual Screening Episode Caption"}:
        season = localized_season_folder(normalize_season_folder(raw_fields.get(FIELD_SEASON, "")), language)
        episode = normalize_episode_folder(raw_fields.get(FIELD_EPISODE, ""))
        return f"{base}/{season}/{episode}_virtual_screening/"

    if task in {"Trailer", "Trailer Caption"}:
        return f"{base}/trailer/"

    if task == "Extras":
        return f"{base}/extras/{extra_folder(raw_fields)}/"

    raise ValueError("Unsupported PathMaker task type.")
