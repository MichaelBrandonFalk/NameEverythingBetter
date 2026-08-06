import {
  LANGUAGE_OPTIONS,
  NEB_DEFAULTS,
  NEB_SINGLE_HIDDEN_TASKS,
  NEB_TASKS,
  slugify,
} from "./neb_core.mjs?v=2026-07-10-spanish-sub";

const PATHMAKER_BUCKET = "gacm-axinom-staging";
const FIELD_SKU = "sku";
const PATHMAKER_SERIES_TASK = "Series";

const PATHMAKER_DEFAULTS = {
  ...NEB_DEFAULTS,
  [FIELD_SKU]: "",
};
const PATHMAKER_EXTRA_USAGE_TO_PREFIX = {
  "Behind the Scenes / Making Of": "bts",
  "Interviews (Cast/Crew)": "int",
  "Deleted Scenes": "del",
  "Bloopers / Alternate Takes": "alt",
  "Promotional Clips": "clp",
};

const PATHMAKER_TASKS = {};
Object.entries(NEB_TASKS).forEach(([task, definition]) => {
  PATHMAKER_TASKS[task] = {
    ...definition,
    fields: [...definition.fields, FIELD_SKU],
    pathFields: definition.fields.filter((field) => !["resolution", "house", "subtitle_type"].includes(field)).concat(FIELD_SKU),
  };
  if (task === "Movie") {
    PATHMAKER_TASKS[PATHMAKER_SERIES_TASK] = {
      fields: ["title", "language", FIELD_SKU],
      pathFields: ["title", "language", FIELD_SKU],
      pathOnly: true,
    };
  }
});

const MOVIE_ROOT_TASKS = new Set([
  "Movie",
  "Caption",
  "Dub Audio",
  "Virtual Screening",
  "Trailer",
  "Trailer Caption",
  "Extras",
]);

const SERIES_ROOT_TASKS = new Set([
  PATHMAKER_SERIES_TASK,
  "Episode",
  "Episode Caption",
  "Original Premium Series (Yearly)",
  "Exclusive Conversation (Yearly)",
  "Virtual Screening Episode",
  "Virtual Screening Episode Caption",
]);

function normalizePathLanguage(value) {
  const language = String(value || "").trim();
  if (!LANGUAGE_OPTIONS.includes(language)) {
    throw new Error("Language must be English or Spanish.");
  }
  return language;
}

function normalizeSku(value) {
  const sku = String(value || "").trim().toLowerCase();
  if (!sku) {
    throw new Error("SKU / Parent SKU is required.");
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(sku)) {
    throw new Error("SKU / Parent SKU can only use letters, numbers, and hyphens.");
  }
  return sku;
}

function normalizeSeasonFolder(value) {
  const raw = String(value || "").trim().toLowerCase().replace(/^s/, "");
  if (!/^\d+$/.test(raw)) {
    throw new Error("Season must be a number like 02.");
  }
  return `s${raw.padStart(2, "0")}`;
}

function normalizeYearSeasonFolder(value) {
  const raw = String(value || "").trim().toLowerCase().replace(/^s/, "");
  if (!/^\d{4}$/.test(raw)) {
    throw new Error("Year must be four digits.");
  }
  return `s${raw}`;
}

function normalizeEpisodeFolder(value) {
  const raw = String(value || "").trim().toLowerCase().replace(/^e/, "");
  if (!/^\d+$/.test(raw)) {
    throw new Error("Episode must be a number like 08.");
  }
  return `e${raw.padStart(2, "0")}`;
}

function titleSlug(rawFields, label = "Title") {
  const slug = slugify(rawFields.title || "");
  if (!slug) {
    throw new Error(`${label} is required.`);
  }
  return slug;
}

function localizedFeatureFolder(language) {
  return language === "Spanish" ? "feature_las" : "feature";
}

function localizedSeasonFolder(seasonFolder, language) {
  return language === "Spanish" ? `${seasonFolder}_las` : seasonFolder;
}

function projectFolder(root, slug, sku) {
  return `s3://${PATHMAKER_BUCKET}/${root}/${slug}_${sku}`;
}

function extraFolder(rawFields) {
  const usage = String(rawFields.extra_usage || "").trim();
  const prefix = PATHMAKER_EXTRA_USAGE_TO_PREFIX[usage];
  if (!prefix) {
    throw new Error("Choose an Extra Type supported by the source file structure doc.");
  }
  const usageSlug = slugify(usage);
  if (!usageSlug) {
    throw new Error("Extra Type is required.");
  }
  return `${prefix}_${usageSlug}`;
}

function rootForTask(task) {
  if (MOVIE_ROOT_TASKS.has(task)) return "movies";
  if (SERIES_ROOT_TASKS.has(task)) return "series";
  throw new Error("Unsupported PathMaker task type.");
}

function projectSlugForTask(task, rawFields) {
  if (task === "Exclusive Conversation (Yearly)") {
    return "exclusive_conversation";
  }
  return titleSlug(rawFields, task === PATHMAKER_SERIES_TASK || task.includes("Episode") ? "Series Title" : "Title");
}

function pathmakerFieldsForTask(task, { forPathOnly = false } = {}) {
  const definition = PATHMAKER_TASKS[task];
  if (!definition) {
    throw new Error("Unsupported PathMaker task type.");
  }
  return forPathOnly ? definition.pathFields : definition.fields;
}

function buildPathmakerPath(task, rawFields) {
  if (!PATHMAKER_TASKS[task]) {
    throw new Error("Unsupported PathMaker task type.");
  }

  const language = normalizePathLanguage(rawFields.language || PATHMAKER_DEFAULTS.language);
  const sku = normalizeSku(rawFields[FIELD_SKU]);
  const root = rootForTask(task);
  const projectSlug = projectSlugForTask(task, rawFields);
  const base = projectFolder(root, projectSlug, sku);

  if (task === PATHMAKER_SERIES_TASK) {
    return `${base}/`;
  }

  if (task === "Movie" || task === "Caption" || task === "Dub Audio") {
    return `${base}/${localizedFeatureFolder(language)}/`;
  }

  if (task === "Episode" || task === "Episode Caption") {
    const season = localizedSeasonFolder(normalizeSeasonFolder(rawFields.season), language);
    const episode = normalizeEpisodeFolder(rawFields.episode);
    return `${base}/${season}/${episode}/`;
  }

  if (task === "Original Premium Series (Yearly)" || task === "Exclusive Conversation (Yearly)") {
    const season = localizedSeasonFolder(normalizeYearSeasonFolder(rawFields.year), language);
    const episode = normalizeEpisodeFolder(rawFields.episode);
    return `${base}/${season}/${episode}/`;
  }

  if (task === "Virtual Screening") {
    return `${base}/feature_virtual_screening/`;
  }

  if (task === "Virtual Screening Episode" || task === "Virtual Screening Episode Caption") {
    const season = localizedSeasonFolder(normalizeSeasonFolder(rawFields.season), language);
    const episode = normalizeEpisodeFolder(rawFields.episode);
    return `${base}/${season}/${episode}_virtual_screening/`;
  }

  if (task === "Trailer" || task === "Trailer Caption") {
    return `${base}/trailer/`;
  }

  if (task === "Extras") {
    return `${base}/extras/${extraFolder(rawFields)}/`;
  }

  throw new Error("Unsupported PathMaker task type.");
}

export {
  FIELD_SKU,
  PATHMAKER_BUCKET,
  PATHMAKER_DEFAULTS,
  PATHMAKER_EXTRA_USAGE_TO_PREFIX,
  PATHMAKER_SERIES_TASK,
  PATHMAKER_TASKS,
  NEB_SINGLE_HIDDEN_TASKS as PATHMAKER_SINGLE_HIDDEN_TASKS,
  buildPathmakerPath,
  pathmakerFieldsForTask,
};
