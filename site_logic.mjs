const LANGUAGE_OPTIONS = ["English", "Spanish"];
const SUBTITLE_TYPE_OPTIONS = ["cc", "sub"];
const RESOLUTION_OPTIONS = ["hd", "sd", "4k"];
const SUBTITLE_DEFAULT_BY_LANGUAGE = {
  English: "cc",
  Spanish: "sub",
};
const EXTRA_USAGE_TO_PREFIX = {
  "Behind the Scenes / Making Of": "bts",
  "Interviews (Cast/Crew)": "int",
  "Deleted Scenes": "del",
  "Bloopers / Alternate Takes": "alt",
  "Music Videos": "mus",
  "Promotional Clips": "clp",
};
const EXTRA_USAGE_OPTIONS = Object.keys(EXTRA_USAGE_TO_PREFIX);
const PLUS_WARNING_MESSAGE = 'Warning: Please make sure your + symbol translated correctly to [and/plus]. If not, please enter "and" or "plus".';

const FIELD_CONFIG = {
  title: { label: "Title *", type: "text", full: true },
  language: { label: "Language *", type: "select" },
  subtitle_type: { label: "Caption Type *", type: "select" },
  resolution: { label: "Resolution *", type: "select" },
  house: { label: "House Number *", type: "text" },
  season: { label: "Season *", type: "text" },
  episode: { label: "Episode *", type: "text" },
  interviewees: { label: "Interviewee(s) *", type: "text", full: true },
  year: { label: "Year *", type: "text" },
  extra_usage: { label: "Extra Type *", type: "select", full: true },
  art_tag: { label: "Art Tag *", type: "select" },
  aspect_ratio: { label: "Aspect Ratio *", type: "select" },
  dimensions: { label: "Dimensions *", type: "select" },
};
const TASK_FIELD_LABEL_OVERRIDES = {
  neb: {
    "Episode": { title: "Series Title *" },
    "Episode Caption": { title: "Series Title *" },
    "Virtual Screening Episode": { title: "Series Title *" },
    "Virtual Screening Episode Caption": { title: "Series Title *" },
  },
  art: {
    "Season Placeholder": { title: "Series Title *" },
    "Episode": { title: "Series Title *" },
    "Virtual Screening Episode": { title: "Series Title *" },
  },
};

const NEB_TASKS = {
  "Movie": { fields: ["title", "language", "resolution", "house"], housePrefixes: ["PUR", "PFP"] },
  "Caption": { fields: ["title", "language", "subtitle_type", "resolution", "house"], housePrefixes: ["PUR", "PFP"] },
  "Dub Audio": { fields: ["title", "language", "resolution", "house"], housePrefixes: ["PUR", "PFP"] },
  "Episode": { fields: ["title", "language", "season", "episode", "resolution", "house"], housePrefixes: ["PUR", "PFP"] },
  "Episode Caption": { fields: ["title", "language", "subtitle_type", "season", "episode", "resolution", "house"], housePrefixes: ["PUR", "PFP"] },
  "Original Premium Series (Yearly)": { fields: ["title", "language", "year", "episode", "resolution", "house"], housePrefixes: ["PFP"] },
  "Exclusive Conversation (Yearly)": { fields: ["language", "year", "episode", "interviewees", "resolution", "house"], housePrefixes: ["PFP"] },
  "Virtual Screening": { fields: ["title", "language", "resolution", "house"], housePrefixes: ["PFP"] },
  "Virtual Screening Episode": { fields: ["title", "language", "season", "episode", "resolution", "house"], housePrefixes: ["PFP"] },
  "Virtual Screening Episode Caption": { fields: ["title", "language", "subtitle_type", "season", "episode", "resolution", "house"], housePrefixes: ["PFP"] },
  "Trailer": { fields: ["title", "language", "resolution", "house"], housePrefixes: ["TRL"] },
  "Trailer Caption": { fields: ["title", "language", "subtitle_type", "resolution", "house"], housePrefixes: ["TRL"] },
  "Extras": { fields: ["title", "language", "extra_usage", "resolution", "house"], housePrefixes: ["EXT"] },
};
const NEB_SINGLE_HIDDEN_TASKS = new Set([
  "Caption",
  "Episode Caption",
  "Trailer Caption",
  "Virtual Screening Episode Caption",
]);
const COMPANION_CAPTION_TASKS = {
  "Movie": "Caption",
  "Episode": "Episode Caption",
  "Trailer": "Trailer Caption",
  "Virtual Screening Episode": "Virtual Screening Episode Caption",
};

const NEB_DEFAULTS = {
  title: "",
  language: "English",
  subtitle_type: "cc",
  resolution: "hd",
  house: "",
  season: "01",
  episode: "01",
  interviewees: "",
  year: "2025",
  extra_usage: "Behind the Scenes / Making Of",
};

const ART_TAG_TO_CODE = {
  "ca - Cover Art": "ca",
  "bg - Background Art": "bg",
  "tt - Title Treatment": "tt",
  ca: "ca",
  bg: "bg",
  tt: "tt",
};

const ART_TAG_CODE_TO_LABEL = {
  ca: "ca - Cover Art",
  bg: "bg - Background Art",
  tt: "tt - Title Treatment",
};

const TASK_ART_TAG_CODES = {
  "Movie": ["ca", "bg", "tt"],
  "Series": ["ca", "bg", "tt"],
  "Season Placeholder": ["ca", "bg"],
  "Episode": ["bg"],
  "Original Premium Series (Yearly)": ["bg"],
  "Exclusive Conversation (Yearly)": ["bg"],
  "Virtual Screening": ["bg"],
  "Virtual Screening Episode": ["bg"],
  "Trailer": ["bg"],
  "Extras": ["bg"],
  "Carousel": ["ca"],
};

const APPROVED_ART_SIZES = {
  ca: {
    "7x3": ["2450x1100"],
    "16x9": ["3840x2160", "1920x1080"],
    "4x3": ["3200x2400", "2560x1920"],
    "3x4": ["2400x3200", "1920x2560"],
    "2x3": ["2000x3000", "1600x2400"],
    "1x1": ["3000x3000"],
  },
  bg: {
    "16x9": ["3840x2160", "2560x1440", "1920x1080"],
    "2x3": ["2000x3000"],
    "7x3": ["2450x1100"],
    "4x3": ["1440x1080"],
  },
  tt: {
    "9x5": ["1800x1000"],
  },
};

const ART_TASKS = {
  "Movie": ["title", "language", "art_tag", "aspect_ratio", "dimensions"],
  "Series": ["title", "language", "art_tag", "aspect_ratio", "dimensions"],
  "Season Placeholder": ["title", "season", "language", "art_tag", "aspect_ratio", "dimensions"],
  "Episode": ["title", "season", "episode", "language", "art_tag", "aspect_ratio", "dimensions"],
  "Original Premium Series (Yearly)": ["title", "year", "episode", "language", "art_tag", "aspect_ratio", "dimensions"],
  "Exclusive Conversation (Yearly)": ["year", "episode", "interviewees", "language", "art_tag", "aspect_ratio", "dimensions"],
  "Virtual Screening": ["title", "language", "art_tag", "aspect_ratio", "dimensions"],
  "Virtual Screening Episode": ["title", "season", "episode", "language", "art_tag", "aspect_ratio", "dimensions"],
  "Trailer": ["title", "language", "art_tag", "aspect_ratio", "dimensions"],
  "Extras": ["title", "language", "extra_usage", "art_tag", "aspect_ratio", "dimensions"],
  "Carousel": ["title", "language", "art_tag", "aspect_ratio", "dimensions"],
};
const ART_DETAIL_FIELDS = new Set(["art_tag", "aspect_ratio", "dimensions"]);
const ART_OUTPUT_MODES = {
  set: "Full Required Art Set",
  single: "One At A Time",
};

const ART_DEFAULTS = {
  title: "",
  language: "English",
  season: "02",
  episode: "05",
  year: "2025",
  interviewees: "",
  extra_usage: "Behind the Scenes / Making Of",
  art_tag: "bg - Background Art",
  aspect_ratio: "16x9",
  dimensions: "1920x1080",
};

const state = {
  domain: null,
  neb: { task: "Movie", values: { ...NEB_DEFAULTS }, subtitleManual: false },
  art: { task: "Movie", values: { ...ART_DEFAULTS }, outputMode: "set" },
};

function slugify(value, { collapseVeggieTales = false } = {}) {
  let lowered = value.trim().toLowerCase();
  lowered = lowered.replace(/['’]/g, "");
  lowered = lowered.replace(/\s+\+\s+/g, " and ");
  lowered = lowered.replace(/&/g, " and ");
  lowered = lowered.replace(/@/g, " at ");
  lowered = lowered.replace(/\+/g, " plus ");
  lowered = lowered.replace(/[·*!.\u00a0]/g, "");
  lowered = lowered.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  let slug = lowered.replace(/[^a-z0-9]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  if (collapseVeggieTales) {
    slug = slug.replace("veggie_tales", "veggietales");
  }
  return slug;
}

function plusWarningNeeded(rawFields) {
  return ["title", "interviewees"].some((field) => (rawFields[field] || "").includes("+"));
}

function normalizeResolution(value) {
  const resolution = String(value || "").trim().toLowerCase();
  if (!["sd", "hd", "4k"].includes(resolution)) {
    throw new Error("Resolution must be sd, hd, or 4k.");
  }
  return resolution;
}

function normalizeHouse(value, allowedPrefixes) {
  const house = String(value || "").trim().toUpperCase();
  const match = house.match(/^([A-Z]{3})(\d{7})$/);
  if (!match) {
    throw new Error("House Number must be 3 letters followed by 7 digits.");
  }
  if (!allowedPrefixes.includes(match[1])) {
    throw new Error(`House Number must start with ${allowedPrefixes.join(", ")}.`);
  }
  return house;
}

function normalizeNebLanguage(value) {
  const language = String(value || "").trim();
  if (!LANGUAGE_OPTIONS.includes(language)) {
    throw new Error("Language must be English or Spanish.");
  }
  return language;
}

function normalizeSubtitleType(value) {
  const subtitleType = String(value || "").trim().toLowerCase();
  if (!SUBTITLE_TYPE_OPTIONS.includes(subtitleType)) {
    throw new Error("Caption Type must be cc or sub.");
  }
  return subtitleType;
}

function normalizeNebSeason(value) {
  let raw = String(value || "").trim().toLowerCase();
  if (raw.startsWith("s")) raw = raw.slice(1);
  if (!/^\d{2}$/.test(raw)) {
    throw new Error("Season must be 2 digits, for example 01.");
  }
  return `s${raw}`;
}

function normalizeNebEpisode(value) {
  let raw = String(value || "").trim().toLowerCase();
  if (raw.startsWith("e")) raw = raw.slice(1);
  if (!/^\d+$/.test(raw)) {
    throw new Error("Episode must be numeric, for example 01.");
  }
  const episodeNum = Number(raw);
  if (episodeNum < 1 || episodeNum > 999) {
    throw new Error("Episode must be between 1 and 999.");
  }
  return `e${String(episodeNum).padStart(2, "0")}`;
}

function normalizeArtEpisode(value) {
  let raw = String(value || "").trim().toLowerCase();
  if (raw.startsWith("e")) raw = raw.slice(1);
  if (!/^\d{2}$/.test(raw)) {
    throw new Error("Episode must be 2 digits, for example 05.");
  }
  return `e${raw}`;
}

function normalizeYear(value) {
  const year = String(value || "").trim();
  if (!/^\d{4}$/.test(year)) {
    throw new Error("Year must be 4 digits, for example 2025.");
  }
  return year;
}

function normalizeInterviewees(value) {
  const interviewees = slugify(value);
  if (!interviewees) {
    throw new Error("Interviewee(s) is required.");
  }
  return interviewees;
}

function normalizeNebTitle(value) {
  const title = slugify(value, { collapseVeggieTales: true });
  if (!title) {
    throw new Error("Title is required.");
  }
  return title;
}

function normalizeArtTitle(value) {
  const title = slugify(value);
  if (!title) {
    throw new Error("Title is required.");
  }
  return title;
}

function normalizeArtLanguage(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "" || raw === "english" || raw === "eng") return "english";
  if (raw === "spanish" || raw === "las") return "spanish";
  throw new Error("Language must be English or Spanish.");
}

function languageSuffix(value) {
  return normalizeArtLanguage(value) === "spanish" ? "las" : "eng";
}

function normalizeExtraUsage(value) {
  const usage = String(value || "").trim();
  const prefix = EXTRA_USAGE_TO_PREFIX[usage];
  if (!prefix) {
    throw new Error("Choose an Extra Type from the dropdown.");
  }
  return prefix;
}

function normalizeArtTag(value) {
  const code = ART_TAG_TO_CODE[String(value || "").trim()];
  if (!["ca", "bg", "tt"].includes(code)) {
    throw new Error("Art Tag must be ca, bg, or tt.");
  }
  return code;
}

function allowedArtTagCodes(task) {
  return TASK_ART_TAG_CODES[task] || ["ca", "bg", "tt"];
}

function allowedArtTagLabels(task) {
  return allowedArtTagCodes(task).map((code) => ART_TAG_CODE_TO_LABEL[code]);
}

function allowedAspectRatios(artTag) {
  return Object.keys(APPROVED_ART_SIZES[artTag] || {});
}

function allowedDimensions(aspectRatio, artTag = null) {
  if (artTag) {
    return (APPROVED_ART_SIZES[artTag] || {})[aspectRatio] || [];
  }
  return [];
}

function normalizeAspectRatio(value, artTag) {
  const ratio = String(value || "").trim().toLowerCase();
  if (!allowedAspectRatios(artTag).includes(ratio)) {
    throw new Error("Choose an approved Aspect Ratio for the selected Art Tag.");
  }
  return ratio;
}

function normalizeDimensions(value, aspectRatio, artTag) {
  const dimensions = String(value || "").trim().toLowerCase();
  if (!/^\d+x\d+$/.test(dimensions)) {
    throw new Error("Dimensions must look like 1920x1080.");
  }
  if (!allowedDimensions(aspectRatio, artTag).includes(dimensions)) {
    throw new Error("Choose an approved Dimensions value for the selected Aspect Ratio.");
  }
  return dimensions;
}

function extensionForArtTag(artTag) {
  return artTag === "tt" ? "png" : "jpg";
}

function requiredArtFields(task) {
  return ART_TASKS[task].filter((field) => !ART_DETAIL_FIELDS.has(field));
}

function requiredArtSpecs(task) {
  const specs = [];
  for (const artTag of allowedArtTagCodes(task)) {
    for (const [aspectRatio, dimensions] of Object.entries(APPROVED_ART_SIZES[artTag] || {})) {
      specs.push({ artTag, aspectRatio, dimensions: dimensions[0] });
    }
  }
  return specs;
}

function buildRequiredArtFilenames(task, rawFields) {
  return requiredArtSpecs(task).map(({ artTag, aspectRatio, dimensions }) => (
    buildArtFilename(task, {
      ...rawFields,
      art_tag: ART_TAG_CODE_TO_LABEL[artTag],
      aspect_ratio: aspectRatio,
      dimensions,
    })
  ));
}

export function buildNebFilename(task, rawFields) {
  const definition = NEB_TASKS[task];
  const resolution = normalizeResolution(rawFields.resolution);
  const house = normalizeHouse(rawFields.house, definition.housePrefixes);

  if (task === "Movie") {
    const title = normalizeNebTitle(rawFields.title);
    const language = normalizeNebLanguage(rawFields.language);
    return `${title}_feature_${resolution}_${house}_${language === "Spanish" ? "las" : "eng"}.mov`;
  }

  if (task === "Caption") {
    const title = normalizeNebTitle(rawFields.title);
    const language = normalizeNebLanguage(rawFields.language);
    const subtitleType = normalizeSubtitleType((rawFields.subtitle_type || SUBTITLE_DEFAULT_BY_LANGUAGE[language]).toLowerCase());
    return language === "Spanish"
      ? `${title}_feature_las_${resolution}_${house}_${subtitleType}_las.vtt`
      : `${title}_feature_${resolution}_${house}_${subtitleType}_eng.vtt`;
  }

  if (task === "Dub Audio") {
    const title = normalizeNebTitle(rawFields.title);
    const language = normalizeNebLanguage(rawFields.language);
    if (language !== "Spanish") {
      throw new Error("Dub Audio is only supported for Spanish in the current Section 7 examples.");
    }
    return `${title}_feature_${resolution}_${house}_dub_las.wav`;
  }

  if (task === "Episode") {
    const title = normalizeNebTitle(rawFields.title);
    const language = normalizeNebLanguage(rawFields.language);
    const season = normalizeNebSeason(rawFields.season);
    const episode = normalizeNebEpisode(rawFields.episode);
    return `${title}_${season}_${episode}_${resolution}_${house}_${language === "Spanish" ? "las" : "eng"}.mov`;
  }

  if (task === "Episode Caption") {
    const title = normalizeNebTitle(rawFields.title);
    const language = normalizeNebLanguage(rawFields.language);
    const subtitleType = normalizeSubtitleType((rawFields.subtitle_type || SUBTITLE_DEFAULT_BY_LANGUAGE[language]).toLowerCase());
    const season = normalizeNebSeason(rawFields.season);
    const episode = normalizeNebEpisode(rawFields.episode);
    return language === "Spanish"
      ? `${title}_${season}_${episode}_las_${resolution}_${house}_${subtitleType}_las.vtt`
      : `${title}_${season}_${episode}_${resolution}_${house}_${subtitleType}_eng.vtt`;
  }

  if (task === "Original Premium Series (Yearly)") {
    const title = normalizeNebTitle(rawFields.title);
    const language = normalizeNebLanguage(rawFields.language);
    const year = normalizeYear(rawFields.year);
    const episode = normalizeNebEpisode(rawFields.episode);
    return `${title}_s${year}_${episode}_${resolution}_${house}_${language === "Spanish" ? "las" : "eng"}.mov`;
  }

  if (task === "Exclusive Conversation (Yearly)") {
    const language = normalizeNebLanguage(rawFields.language);
    const year = normalizeYear(rawFields.year);
    const episode = normalizeNebEpisode(rawFields.episode);
    const interviewees = normalizeInterviewees(rawFields.interviewees);
    return `exclusive_conversations_s${year}_${episode}_${interviewees}_${resolution}_${house}_${language === "Spanish" ? "las" : "eng"}.mov`;
  }

  if (task === "Virtual Screening") {
    const title = normalizeNebTitle(rawFields.title);
    const language = normalizeNebLanguage(rawFields.language);
    return `${title}_virtual_screening_${resolution}_${house}_${language === "Spanish" ? "las" : "eng"}.mov`;
  }

  if (task === "Virtual Screening Episode") {
    const title = normalizeNebTitle(rawFields.title);
    const language = normalizeNebLanguage(rawFields.language);
    const season = normalizeNebSeason(rawFields.season);
    const episode = normalizeNebEpisode(rawFields.episode);
    return `${title}_${season}_${episode}_virtual_screening_${resolution}_${house}_${language === "Spanish" ? "las" : "eng"}.mov`;
  }

  if (task === "Virtual Screening Episode Caption") {
    const title = normalizeNebTitle(rawFields.title);
    const language = normalizeNebLanguage(rawFields.language);
    const subtitleType = normalizeSubtitleType((rawFields.subtitle_type || SUBTITLE_DEFAULT_BY_LANGUAGE[language]).toLowerCase());
    const season = normalizeNebSeason(rawFields.season);
    const episode = normalizeNebEpisode(rawFields.episode);
    return language === "Spanish"
      ? `${title}_${season}_${episode}_virtual_screening_las_${resolution}_${house}_${subtitleType}_las.vtt`
      : `${title}_${season}_${episode}_virtual_screening_${resolution}_${house}_${subtitleType}_eng.vtt`;
  }

  if (task === "Trailer") {
    const title = normalizeNebTitle(rawFields.title);
    const language = normalizeNebLanguage(rawFields.language);
    return `${title}_trailer_${resolution}_${house}_${language === "Spanish" ? "las" : "eng"}.mov`;
  }

  if (task === "Trailer Caption") {
    const title = normalizeNebTitle(rawFields.title);
    const language = normalizeNebLanguage(rawFields.language);
    const subtitleType = normalizeSubtitleType((rawFields.subtitle_type || SUBTITLE_DEFAULT_BY_LANGUAGE[language]).toLowerCase());
    return language === "Spanish"
      ? `${title}_trailer_las_${resolution}_${house}_${subtitleType}_las.vtt`
      : `${title}_trailer_${resolution}_${house}_${subtitleType}_eng.vtt`;
  }

  if (task === "Extras") {
    const title = normalizeNebTitle(rawFields.title);
    const language = normalizeNebLanguage(rawFields.language);
    const extraPrefix = normalizeExtraUsage(rawFields.extra_usage);
    return `${title}_${extraPrefix}_${resolution}_${house}_${language === "Spanish" ? "las" : "eng"}.mov`;
  }

  throw new Error("Unsupported task type.");
}

export function buildArtFilename(task, rawFields) {
  const artTag = normalizeArtTag(rawFields.art_tag);
  if (!allowedArtTagCodes(task).includes(artTag)) {
    throw new Error("Choose an allowed Art Tag for the selected art type.");
  }

  const aspectRatio = normalizeAspectRatio(rawFields.aspect_ratio, artTag);
  const dimensions = normalizeDimensions(rawFields.dimensions, aspectRatio, artTag);
  const extension = extensionForArtTag(artTag);
  const languageSegment = `_${languageSuffix(rawFields.language)}`;

  if (task === "Movie") {
    const title = normalizeArtTitle(rawFields.title);
    return `${title}${languageSegment}_${artTag}_${aspectRatio}_${dimensions}.${extension}`;
  }

  if (task === "Series") {
    const title = normalizeArtTitle(rawFields.title);
    return `${title}${languageSegment}_${artTag}_${aspectRatio}_${dimensions}.${extension}`;
  }

  if (task === "Season Placeholder") {
    const title = normalizeArtTitle(rawFields.title);
    const season = normalizeNebSeason(rawFields.season);
    return `${title}_${season}${languageSegment}_${artTag}_${aspectRatio}_${dimensions}.${extension}`;
  }

  if (task === "Episode") {
    const title = normalizeArtTitle(rawFields.title);
    const season = normalizeNebSeason(rawFields.season);
    const episode = normalizeArtEpisode(rawFields.episode);
    return `${title}_${season}_${episode}${languageSegment}_${artTag}_${aspectRatio}_${dimensions}.${extension}`;
  }

  if (task === "Original Premium Series (Yearly)") {
    const title = normalizeArtTitle(rawFields.title);
    const year = normalizeYear(rawFields.year);
    const episode = normalizeArtEpisode(rawFields.episode);
    return `${title}_s${year}_${episode}${languageSegment}_${artTag}_${aspectRatio}_${dimensions}.${extension}`;
  }

  if (task === "Exclusive Conversation (Yearly)") {
    const year = normalizeYear(rawFields.year);
    const episode = normalizeArtEpisode(rawFields.episode);
    const interviewees = normalizeInterviewees(rawFields.interviewees);
    return `exclusive_conversations_s${year}_${episode}_${interviewees}${languageSegment}_${artTag}_${aspectRatio}_${dimensions}.${extension}`;
  }

  if (task === "Virtual Screening") {
    const title = normalizeArtTitle(rawFields.title);
    return `${title}_virtual_screening${languageSegment}_${artTag}_${aspectRatio}_${dimensions}.${extension}`;
  }

  if (task === "Virtual Screening Episode") {
    const title = normalizeArtTitle(rawFields.title);
    const season = normalizeNebSeason(rawFields.season);
    const episode = normalizeArtEpisode(rawFields.episode);
    return `${title}_${season}_${episode}_virtual_screening${languageSegment}_${artTag}_${aspectRatio}_${dimensions}.${extension}`;
  }

  if (task === "Trailer") {
    const title = normalizeArtTitle(rawFields.title);
    return `${title}_trailer${languageSegment}_${artTag}_${aspectRatio}_${dimensions}.${extension}`;
  }

  if (task === "Extras") {
    const title = normalizeArtTitle(rawFields.title);
    const extraPrefix = normalizeExtraUsage(rawFields.extra_usage);
    return `${title}_${extraPrefix}${languageSegment}_${artTag}_${aspectRatio}_${dimensions}.${extension}`;
  }

  if (task === "Carousel") {
    const title = normalizeArtTitle(rawFields.title);
    return `${title}_carousel${languageSegment}_${artTag}_${aspectRatio}_${dimensions}.${extension}`;
  }

  throw new Error("Unsupported art type.");
}

function optionsForField(domain, field, task, values) {
  if (field === "language") return LANGUAGE_OPTIONS;
  if (field === "subtitle_type") return SUBTITLE_TYPE_OPTIONS;
  if (field === "resolution") return RESOLUTION_OPTIONS;
  if (field === "extra_usage") return EXTRA_USAGE_OPTIONS;
  if (field === "art_tag") return allowedArtTagLabels(task);
  if (field === "aspect_ratio") {
    const artTag = normalizeArtTag(values.art_tag || allowedArtTagLabels(task)[0]);
    return allowedAspectRatios(artTag);
  }
  if (field === "dimensions") {
    const artTag = normalizeArtTag(values.art_tag || allowedArtTagLabels(task)[0]);
    const ratio = values.aspect_ratio && allowedAspectRatios(artTag).includes(values.aspect_ratio)
      ? values.aspect_ratio
      : allowedAspectRatios(artTag)[0];
    return allowedDimensions(ratio, artTag);
  }
  return [];
}

function getDomainState() {
  return state.domain === "neb" ? state.neb : state.art;
}

function resetOutput() {
  const status = document.getElementById("status");
  const outputs = [
    document.getElementById("filename-output-video"),
    document.getElementById("filename-output-caption-eng"),
    document.getElementById("filename-output-caption-las"),
  ];
  status.textContent = "";
  status.className = "status hidden";
  outputs.forEach((output) => {
    output.textContent = "";
  });
}

function goHome() {
  state.domain = null;
  document.getElementById("builder").classList.add("hidden");
  document.getElementById("domain-chooser").classList.remove("hidden");
  resetOutput();
  const top = document.getElementById("top");
  if (top) {
    top.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function setStatus(message, tone) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `status ${tone}`;
}

function currentTaskMap() {
  return state.domain === "neb" ? NEB_TASKS : ART_TASKS;
}

function currentVisibleTaskNames() {
  if (state.domain === "neb") {
    return Object.keys(NEB_TASKS).filter((taskName) => !NEB_SINGLE_HIDDEN_TASKS.has(taskName));
  }
  return Object.keys(ART_TASKS);
}

function currentDefaults() {
  return state.domain === "neb" ? NEB_DEFAULTS : ART_DEFAULTS;
}

function normalizeArtDependentValues(taskState) {
  const task = taskState.task;
  const allowedTags = allowedArtTagLabels(task);
  if (!allowedTags.includes(taskState.values.art_tag)) {
    [taskState.values.art_tag] = allowedTags;
  }
  const artTagCode = normalizeArtTag(taskState.values.art_tag);
  const ratios = allowedAspectRatios(artTagCode);
  if (!ratios.includes(taskState.values.aspect_ratio)) {
    [taskState.values.aspect_ratio] = ratios;
  }
  const dims = allowedDimensions(taskState.values.aspect_ratio, artTagCode);
  if (!dims.includes(taskState.values.dimensions)) {
    [taskState.values.dimensions] = dims;
  }
}

function renderBuilder() {
  const builder = document.getElementById("builder");
  const chooser = document.getElementById("domain-chooser");
  const taskLabel = document.getElementById("task-label");
  const taskSelect = document.getElementById("task-select");
  const artModeWrap = document.getElementById("art-mode-wrap");
  const artModeSelect = document.getElementById("art-mode-select");
  const fields = document.getElementById("fields");
  const eyebrow = document.getElementById("builder-eyebrow");
  const title = document.getElementById("builder-title");
  const domainState = getDomainState();
  const taskMap = currentTaskMap();
  const taskNames = currentVisibleTaskNames();

  if (state.domain === "art") {
    normalizeArtDependentValues(domainState);
  }

  chooser.classList.add("hidden");
  builder.classList.remove("hidden");
  eyebrow.textContent = state.domain === "neb" ? "Neb" : "Verso";
  title.textContent = state.domain === "neb" ? "Movies and Captions" : "Art";
  taskLabel.textContent = state.domain === "neb" ? "What are you naming?" : "This art is for :";
  taskSelect.innerHTML = taskNames.map((taskName) => `<option value="${taskName}">${taskName}</option>`).join("");
  taskSelect.value = domainState.task;

  if (state.domain === "art") {
    artModeWrap.classList.remove("hidden");
    artModeSelect.innerHTML = Object.entries(ART_OUTPUT_MODES)
      .map(([value, label]) => `<option value="${value}">${label}</option>`)
      .join("");
    artModeSelect.value = domainState.outputMode;
  } else {
    artModeWrap.classList.add("hidden");
  }

  const taskFields = state.domain === "art"
    ? (domainState.outputMode === "set" ? requiredArtFields(domainState.task) : taskMap[domainState.task])
    : (taskMap[domainState.task].fields || taskMap[domainState.task]);
  fields.innerHTML = taskFields.map((field) => renderField(field, domainState)).join("");
  bindFieldHandlers(taskFields);
  refreshOutputVisibility();
}

function renderField(field, domainState) {
  const config = FIELD_CONFIG[field];
  const task = domainState.task;
  const value = domainState.values[field] ?? "";
  const classes = config.full ? "field full" : "field";
  const label = TASK_FIELD_LABEL_OVERRIDES[state.domain]?.[task]?.[field] || config.label;

  if (config.type === "select") {
    const options = optionsForField(state.domain, field, task, domainState.values);
    const resolvedValue = options.includes(value) ? value : options[0];
    domainState.values[field] = resolvedValue;
    const optionsHtml = options.map((option) => `<option value="${option}">${option}</option>`).join("");
    return `
      <div class="${classes}">
        <label for="field-${field}">${label}</label>
        <select id="field-${field}" data-field="${field}">${optionsHtml}</select>
      </div>
    `;
  }

  return `
    <div class="${classes}">
      <label for="field-${field}">${label}</label>
      <input id="field-${field}" data-field="${field}" type="text" value="${escapeHtml(String(value))}">
    </div>
  `;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function refreshOutputVisibility() {
  const hasCompanionCaptions = state.domain === "neb" && Boolean(COMPANION_CAPTION_TASKS[getDomainState().task]);
  const outputLabel = document.getElementById("output-video-label");
  const outputNote = document.getElementById("output-note");
  const downloadBtn = document.getElementById("download-btn");
  const generateBtn = document.getElementById("generate-btn");
  const copyBtn = document.getElementById("copy-btn");
  document.getElementById("output-video-wrap").classList.remove("hidden");
  if (state.domain === "neb") {
    outputLabel.textContent = "MOV Name";
    outputNote.textContent = "For supported video tasks, the tool shows the MOV name plus English and Spanish caption names together.";
    downloadBtn.classList.add("hidden");
    generateBtn.textContent = "Generate Name";
    copyBtn.textContent = "Copy All Names";
    document.getElementById("output-caption-eng-wrap").classList.toggle("hidden", !hasCompanionCaptions);
    document.getElementById("output-caption-las-wrap").classList.toggle("hidden", !hasCompanionCaptions);
  } else {
    outputLabel.textContent = getDomainState().outputMode === "set" ? "Required Art Names" : "Art Filename";
    outputNote.textContent = getDomainState().outputMode === "set"
      ? "The art side defaults to the full required filename set, using only the highest resolution for each required art type and aspect ratio."
      : "Switch to one-at-a-time if you need a single custom art filename.";
    downloadBtn.classList.remove("hidden");
    generateBtn.textContent = getDomainState().outputMode === "set" ? "Generate Names" : "Generate Name";
    copyBtn.textContent = getDomainState().outputMode === "set" ? "Copy All Names" : "Copy Name";
    document.getElementById("output-caption-eng-wrap").classList.add("hidden");
    document.getElementById("output-caption-las-wrap").classList.add("hidden");
  }
}

function bindFieldHandlers(taskFields) {
  taskFields.forEach((field) => {
    const el = document.getElementById(`field-${field}`);
    if (!el) return;
    el.value = getDomainState().values[field] ?? "";
    el.addEventListener("input", onFieldInput);
    el.addEventListener("change", onFieldInput);
  });
}

function onFieldInput(event) {
  const field = event.target.dataset.field;
  const domainState = getDomainState();
  domainState.values[field] = event.target.value;

  if (state.domain === "neb" && field === "subtitle_type") {
    domainState.subtitleManual = true;
  }

  if (state.domain === "neb" && field === "language" && ["Caption", "Episode Caption", "Trailer Caption", "Virtual Screening Episode Caption"].includes(domainState.task)) {
    if (!domainState.subtitleManual) {
      domainState.values.subtitle_type = SUBTITLE_DEFAULT_BY_LANGUAGE[event.target.value] || "cc";
    }
  }

  if (state.domain === "art" && (field === "art_tag" || field === "aspect_ratio")) {
    renderBuilder();
    return;
  }

  resetOutput();
}

function onTaskChange(event) {
  const domainState = getDomainState();
  domainState.task = event.target.value;
  if (state.domain === "neb") {
    domainState.subtitleManual = false;
    const language = domainState.values.language || "English";
    domainState.values.subtitle_type = SUBTITLE_DEFAULT_BY_LANGUAGE[language] || "cc";
  }
  renderBuilder();
  resetOutput();
}

function onArtModeChange(event) {
  state.art.outputMode = event.target.value;
  renderBuilder();
  resetOutput();
}

function clearCurrentForm() {
  const defaults = currentDefaults();
  if (state.domain === "neb") {
    state.neb.values = { ...defaults };
    state.neb.subtitleManual = false;
  } else {
    const currentMode = state.art.outputMode;
    state.art.values = { ...defaults };
    state.art.outputMode = currentMode;
  }
  renderBuilder();
  resetOutput();
}

function companionCaptionOutputs(task, rawFields) {
  const captionTask = COMPANION_CAPTION_TASKS[task];
  if (!captionTask) {
    return null;
  }
  return {
    eng: buildNebFilename(captionTask, {
      ...rawFields,
      language: "English",
      subtitle_type: SUBTITLE_DEFAULT_BY_LANGUAGE.English,
    }),
    las: buildNebFilename(captionTask, {
      ...rawFields,
      language: "Spanish",
      subtitle_type: SUBTITLE_DEFAULT_BY_LANGUAGE.Spanish,
    }),
  };
}

function generateCurrentFilename() {
  const domainState = getDomainState();
  try {
    let filename;
    let companionCaptions = null;
    if (state.domain === "neb") {
      filename = buildNebFilename(domainState.task, domainState.values);
      companionCaptions = companionCaptionOutputs(domainState.task, domainState.values);
    } else {
      filename = domainState.outputMode === "set"
        ? buildRequiredArtFilenames(domainState.task, domainState.values).join("\n")
        : buildArtFilename(domainState.task, domainState.values);
    }

    document.getElementById("filename-output-video").textContent = filename;
    document.getElementById("filename-output-caption-eng").textContent = companionCaptions?.eng || "";
    document.getElementById("filename-output-caption-las").textContent = companionCaptions?.las || "";
    if (plusWarningNeeded(domainState.values)) {
      setStatus(`Names generated. ${PLUS_WARNING_MESSAGE}`, "warning");
    } else {
      setStatus("Names generated.", "success");
    }
  } catch (error) {
    document.getElementById("filename-output-video").textContent = "";
    document.getElementById("filename-output-caption-eng").textContent = "";
    document.getElementById("filename-output-caption-las").textContent = "";
    setStatus(error.message || "Unable to generate filename.", "error");
  }
}

async function copyFilename() {
  const text = [
    document.getElementById("filename-output-video").textContent.trim(),
    document.getElementById("filename-output-caption-eng").textContent.trim(),
    document.getElementById("filename-output-caption-las").textContent.trim(),
  ].filter(Boolean).join("\n");
  if (!text) {
    setStatus("Generate names first.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Generated names copied.", "success");
  } catch {
    setStatus("Clipboard access was blocked. Copy the generated names manually.", "warning");
  }
}

function downloadCurrentOutput() {
  if (state.domain !== "art") {
    return;
  }
  const text = document.getElementById("filename-output-video").textContent.trim();
  if (!text) {
    setStatus("Generate names first.", "error");
    return;
  }
  const titleSlug = slugify(state.art.values.title || "") || "art_names";
  const taskSlug = slugify(state.art.task) || "art";
  const suffix = state.art.outputMode === "set" ? "required_art_names" : "art_filename";
  const filename = `${titleSlug}_${taskSlug}_${suffix}.csv`;
  const rows = text.split("\n").filter(Boolean);
  const csvEscape = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = ["filename", ...rows].map(csvEscape).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus("Art name CSV downloaded.", "success");
}

function init() {
  const chooser = document.getElementById("domain-chooser");
  const taskSelect = document.getElementById("task-select");
  const artModeSelect = document.getElementById("art-mode-select");
  const backBtn = document.getElementById("back-btn");
  const generateBtn = document.getElementById("generate-btn");
  const clearBtn = document.getElementById("clear-btn");
  const copyBtn = document.getElementById("copy-btn");
  const downloadBtn = document.getElementById("download-btn");

  chooser.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-domain]");
    if (!button) return;
    state.domain = button.dataset.domain;
    renderBuilder();
    resetOutput();
  });

  taskSelect.addEventListener("change", onTaskChange);
  artModeSelect.addEventListener("change", onArtModeChange);
  backBtn.addEventListener("click", goHome);
  generateBtn.addEventListener("click", generateCurrentFilename);
  clearBtn.addEventListener("click", clearCurrentForm);
  copyBtn.addEventListener("click", copyFilename);
  downloadBtn.addEventListener("click", downloadCurrentOutput);
}

if (typeof document !== "undefined") {
  init();
}
