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
const EXTERNAL_REFERENCE_EPISODIC_TASKS = new Set([
  "Episode",
  "Episode Caption",
  "Virtual Screening Episode",
  "Virtual Screening Episode Caption",
  "Original Premium Series (Yearly)",
  "Exclusive Conversation (Yearly)",
]);

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

const ART_TASK_PODCAST_EPISODES = "Podcast Episodes";
const ART_TASK_FAMILIA_MINI_NOVELAS_SERIES = "Familia Mini-Novelas Series";
const ART_TASK_FAMILIA_MINI_NOVELAS_EPISODES = "Familia Mini-Novelas Episodes";
const ART_FILENAME_TEMPLATE_TASK = {
  [ART_TASK_PODCAST_EPISODES]: "Episode",
  [ART_TASK_FAMILIA_MINI_NOVELAS_SERIES]: "Series",
  [ART_TASK_FAMILIA_MINI_NOVELAS_EPISODES]: "Episode",
};

const TASK_ART_TAG_CODES = {
  "Movie": ["ca", "bg", "tt"],
  "Series": ["ca", "bg", "tt"],
  "Season Placeholder": ["ca", "bg", "tt"],
  "Episode": ["bg"],
  "Original Premium Series (Yearly)": ["bg"],
  "Exclusive Conversation (Yearly)": ["bg"],
  "Virtual Screening": ["bg"],
  "Virtual Screening Episode": ["bg"],
  "Trailer": ["bg"],
  "Extras": ["bg"],
  "Carousel": ["ca"],
  [ART_TASK_PODCAST_EPISODES]: ["bg"],
  [ART_TASK_FAMILIA_MINI_NOVELAS_SERIES]: ["ca", "bg", "tt"],
  [ART_TASK_FAMILIA_MINI_NOVELAS_EPISODES]: ["bg"],
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

const TASK_ADDITIONAL_ART_SIZES = {
  [ART_TASK_PODCAST_EPISODES]: {
    bg: {
      "1x1": ["3000x3000"],
    },
  },
  [ART_TASK_FAMILIA_MINI_NOVELAS_SERIES]: {
    ca: {
      "9x16": ["2160x3840"],
    },
    bg: {
      "9x16": ["2160x3840"],
    },
  },
  [ART_TASK_FAMILIA_MINI_NOVELAS_EPISODES]: {
    bg: {
      "9x16": ["1080x1920"],
    },
  },
};

function approvedArtSizesForTask(task, artTag) {
  const merged = {};
  const addSizes = (sizes) => {
    for (const [aspectRatio, dimensions] of Object.entries(sizes || {})) {
      if (!merged[aspectRatio]) {
        merged[aspectRatio] = [];
      }
      for (const dimension of dimensions) {
        if (!merged[aspectRatio].includes(dimension)) {
          merged[aspectRatio].push(dimension);
        }
      }
    }
  };
  addSizes(APPROVED_ART_SIZES[artTag]);
  addSizes(TASK_ADDITIONAL_ART_SIZES[task]?.[artTag]);
  return merged;
}

const AXINOM_REQUIRED_ART_SPECS = {
  "Movie": [
    { task: "Movie", artTag: "ca", aspectRatio: "7x3", dimensions: "2450x1100" },
    { task: "Movie", artTag: "ca", aspectRatio: "2x3", dimensions: "2000x3000" },
    { task: "Movie", artTag: "ca", aspectRatio: "3x4", dimensions: "2400x3200" },
    { task: "Movie", artTag: "ca", aspectRatio: "1x1", dimensions: "3000x3000" },
    { task: "Movie", artTag: "ca", aspectRatio: "4x3", dimensions: "3200x2400" },
    { task: "Movie", artTag: "ca", aspectRatio: "16x9", dimensions: "3840x2160" },
    { task: "Movie", artTag: "bg", aspectRatio: "16x9", dimensions: "3840x2160" },
    { task: "Movie", artTag: "bg", aspectRatio: "7x3", dimensions: "2450x1100" },
    { task: "Movie", artTag: "tt", aspectRatio: "9x5", dimensions: "1800x1000" },
  ],
  "Series": [
    { task: "Series", artTag: "ca", aspectRatio: "7x3", dimensions: "2450x1100" },
    { task: "Series", artTag: "ca", aspectRatio: "2x3", dimensions: "2000x3000" },
    { task: "Series", artTag: "ca", aspectRatio: "3x4", dimensions: "2400x3200" },
    { task: "Series", artTag: "ca", aspectRatio: "1x1", dimensions: "3000x3000" },
    { task: "Series", artTag: "ca", aspectRatio: "4x3", dimensions: "3200x2400" },
    { task: "Series", artTag: "ca", aspectRatio: "16x9", dimensions: "3840x2160" },
    { task: "Series", artTag: "bg", aspectRatio: "16x9", dimensions: "3840x2160" },
    { task: "Series", artTag: "bg", aspectRatio: "7x3", dimensions: "2450x1100" },
    { task: "Series", artTag: "tt", aspectRatio: "9x5", dimensions: "1800x1000" },
  ],
  "Season Placeholder": [
    { task: "Season Placeholder", artTag: "ca", aspectRatio: "16x9", dimensions: "3840x2160" },
    { task: "Season Placeholder", artTag: "ca", aspectRatio: "4x3", dimensions: "3200x2400" },
    { task: "Season Placeholder", artTag: "bg", aspectRatio: "16x9", dimensions: "3840x2160" },
  ],
  "Episode": [
    { task: "Episode", artTag: "bg", aspectRatio: "16x9", dimensions: "1920x1080" },
  ],
  "Extras": [
    { task: "Extras", artTag: "bg", aspectRatio: "16x9", dimensions: "1920x1080" },
  ],
  [ART_TASK_PODCAST_EPISODES]: [
    { task: ART_TASK_PODCAST_EPISODES, artTag: "bg", aspectRatio: "16x9", dimensions: "3840x2160" },
    { task: ART_TASK_PODCAST_EPISODES, artTag: "bg", aspectRatio: "16x9", dimensions: "1920x1080" },
    { task: ART_TASK_PODCAST_EPISODES, artTag: "bg", aspectRatio: "1x1", dimensions: "3000x3000" },
  ],
  [ART_TASK_FAMILIA_MINI_NOVELAS_SERIES]: [
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_SERIES, artTag: "ca", aspectRatio: "7x3", dimensions: "2450x1100" },
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_SERIES, artTag: "ca", aspectRatio: "2x3", dimensions: "2000x3000" },
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_SERIES, artTag: "ca", aspectRatio: "3x4", dimensions: "2400x3200" },
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_SERIES, artTag: "ca", aspectRatio: "1x1", dimensions: "3000x3000" },
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_SERIES, artTag: "ca", aspectRatio: "4x3", dimensions: "3200x2400" },
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_SERIES, artTag: "ca", aspectRatio: "16x9", dimensions: "3840x2160" },
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_SERIES, artTag: "ca", aspectRatio: "9x16", dimensions: "2160x3840" },
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_SERIES, artTag: "bg", aspectRatio: "16x9", dimensions: "3840x2160" },
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_SERIES, artTag: "bg", aspectRatio: "2x3", dimensions: "2000x3000" },
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_SERIES, artTag: "bg", aspectRatio: "7x3", dimensions: "2450x1100" },
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_SERIES, artTag: "bg", aspectRatio: "9x16", dimensions: "2160x3840" },
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_SERIES, artTag: "tt", aspectRatio: "9x5", dimensions: "1800x1000" },
  ],
  [ART_TASK_FAMILIA_MINI_NOVELAS_EPISODES]: [
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_EPISODES, artTag: "bg", aspectRatio: "16x9", dimensions: "3840x2160" },
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_EPISODES, artTag: "bg", aspectRatio: "16x9", dimensions: "1920x1080" },
    { task: ART_TASK_FAMILIA_MINI_NOVELAS_EPISODES, artTag: "bg", aspectRatio: "9x16", dimensions: "1080x1920" },
  ],
};
const SYNDICATION_REQUIRED_ART_SPECS = {
  "Movie": [
    { artTag: "ca", aspectRatio: "16x9", dimensions: "3840x2160" },
    { artTag: "ca", aspectRatio: "16x9", dimensions: "1920x1080" },
    { artTag: "ca", aspectRatio: "2x3", dimensions: "2000x3000" },
    { artTag: "ca", aspectRatio: "2x3", dimensions: "1600x2400" },
    { artTag: "ca", aspectRatio: "3x4", dimensions: "1920x2560" },
    { artTag: "ca", aspectRatio: "3x4", dimensions: "2400x3200" },
    { artTag: "bg", aspectRatio: "16x9", dimensions: "3840x2160" },
    { artTag: "bg", aspectRatio: "16x9", dimensions: "2560x1440" },
    { artTag: "bg", aspectRatio: "16x9", dimensions: "1920x1080" },
    { artTag: "bg", aspectRatio: "2x3", dimensions: "2000x3000" },
    { artTag: "tt", aspectRatio: "9x5", dimensions: "1800x1000" },
  ],
  "Series": [
    { artTag: "ca", aspectRatio: "16x9", dimensions: "3840x2160" },
    { artTag: "ca", aspectRatio: "16x9", dimensions: "1920x1080" },
    { artTag: "ca", aspectRatio: "1x1", dimensions: "3000x3000" },
    { artTag: "ca", aspectRatio: "2x3", dimensions: "2000x3000" },
    { artTag: "ca", aspectRatio: "2x3", dimensions: "1600x2400" },
    { artTag: "bg", aspectRatio: "16x9", dimensions: "3840x2160" },
    { artTag: "bg", aspectRatio: "16x9", dimensions: "2560x1440" },
    { artTag: "bg", aspectRatio: "16x9", dimensions: "1920x1080" },
    { artTag: "bg", aspectRatio: "2x3", dimensions: "2000x3000" },
    { artTag: "tt", aspectRatio: "9x5", dimensions: "1800x1000" },
  ],
  "Season Placeholder": [
    { artTag: "ca", aspectRatio: "16x9", dimensions: "3840x2160" },
    { artTag: "ca", aspectRatio: "16x9", dimensions: "1920x1080" },
    { artTag: "ca", aspectRatio: "4x3", dimensions: "2560x1920" },
    { artTag: "ca", aspectRatio: "2x3", dimensions: "2000x3000" },
    { artTag: "ca", aspectRatio: "2x3", dimensions: "1600x2400" },
    { artTag: "bg", aspectRatio: "16x9", dimensions: "3840x2160" },
    { artTag: "bg", aspectRatio: "16x9", dimensions: "2560x1440" },
    { artTag: "bg", aspectRatio: "16x9", dimensions: "1920x1080" },
    { artTag: "tt", aspectRatio: "9x5", dimensions: "1800x1000" },
  ],
  "Episode": [
    { artTag: "bg", aspectRatio: "16x9", dimensions: "3840x2160" },
    { artTag: "bg", aspectRatio: "16x9", dimensions: "2560x1440" },
    { artTag: "bg", aspectRatio: "16x9", dimensions: "1920x1080" },
  ],
};
const TAGGED_REQUIRED_ART_TASKS = new Set([
  ...Object.keys(SYNDICATION_REQUIRED_ART_SPECS),
  ...Object.keys(AXINOM_REQUIRED_ART_SPECS),
]);
const PRESERVED_REQUIRED_ART_VARIANTS = new Set([
  "Episode|bg|16x9|1920x1080",
  `${ART_TASK_PODCAST_EPISODES}|bg|16x9|1920x1080`,
  `${ART_TASK_FAMILIA_MINI_NOVELAS_EPISODES}|bg|16x9|1920x1080`,
]);

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
  [ART_TASK_PODCAST_EPISODES]: ["title", "season", "episode", "language", "art_tag", "aspect_ratio", "dimensions"],
  [ART_TASK_FAMILIA_MINI_NOVELAS_SERIES]: ["title", "language", "art_tag", "aspect_ratio", "dimensions"],
  [ART_TASK_FAMILIA_MINI_NOVELAS_EPISODES]: ["title", "season", "episode", "language", "art_tag", "aspect_ratio", "dimensions"],
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

function slugify(value, { collapseVeggieTales = false } = {}) {
  let lowered = value.trim().toLowerCase();
  lowered = lowered.replace(/['’]/g, "");
  lowered = lowered.replace(/\s+\+\s+/g, " and ");
  lowered = lowered.replace(/&/g, " and ");
  lowered = lowered.replace(/@/g, " at ");
  lowered = lowered.replace(/\+/g, " plus ");
  lowered = lowered.replace(/([a-z0-9])\.\.\.(?=[a-z0-9])/g, "$1_");
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

function normalizeHouse(value, allowedPrefixes, language = null) {
  const house = String(value || "").trim().toUpperCase();
  const match = house.match(/^([A-Z]{3})(\d{7})$/);
  if (!match) {
    throw new Error("House Number must be 3 letters followed by 7 digits.");
  }
  const expectedPrefixes = language === "Spanish" ? ["LAS"] : allowedPrefixes;
  if (!expectedPrefixes.includes(match[1])) {
    throw new Error(`House Number must start with ${expectedPrefixes.join(", ")}.`);
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

function subtitleTypeForLanguage(language, value) {
  if (language === "Spanish") {
    return "sub";
  }
  return normalizeSubtitleType((value || SUBTITLE_DEFAULT_BY_LANGUAGE[language]).toLowerCase());
}

function movLanguageSegment(language) {
  return language === "Spanish" ? "_las" : "";
}

function nebLanguageSuffix(language) {
  return language === "Spanish" ? "las" : "eng";
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

function normalizeExternalReferenceSourceTitle(task, rawFields) {
  if (task === "Exclusive Conversation (Yearly)") {
    return "Exclusive Conversations";
  }
  const title = String(rawFields.title || "").trim();
  if (!title) {
    throw new Error("Title is required.");
  }
  return title;
}

function shortenExternalReferenceTitle(value) {
  const normalized = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
  const rawWords = normalized.split(/\s+/).map((word) => word.trim()).filter(Boolean);
  if (!rawWords.length) {
    throw new Error("Title is required.");
  }

  const shortenedWords = rawWords
    .map((word) => {
      const cleaned = word.replace(/[^A-Za-z0-9]/g, "");
      if (!cleaned) {
        return "";
      }
      let output = "";
      let previousConsonant = "";
      [...cleaned].forEach((char, index) => {
        if (/\d/.test(char)) {
          output += char;
          previousConsonant = "";
          return;
        }
        const lower = char.toLowerCase();
        const isVowel = "aeiou".includes(lower);
        const isConsonant = /[a-z]/i.test(char) && !isVowel;
        if (index === 0) {
          output += char.toUpperCase();
          previousConsonant = isConsonant ? lower : "";
          return;
        }
        if (!isConsonant) {
          return;
        }
        if (lower === previousConsonant) {
          return;
        }
        output += char;
        previousConsonant = lower;
      });
      return output;
    })
    .filter(Boolean);

  if (!shortenedWords.length) {
    throw new Error("Title is required.");
  }
  return shortenedWords.join("");
}

function buildNebExternalReference(task, rawFields) {
  const shortenedTitle = shortenExternalReferenceTitle(normalizeExternalReferenceSourceTitle(task, rawFields));
  if (!EXTERNAL_REFERENCE_EPISODIC_TASKS.has(task)) {
    return shortenedTitle;
  }

  const seasonToken = task === "Original Premium Series (Yearly)" || task === "Exclusive Conversation (Yearly)"
    ? `S${normalizeYear(rawFields.year)}`
    : normalizeNebSeason(rawFields.season).toUpperCase();
  const episodeToken = normalizeNebEpisode(rawFields.episode).toUpperCase();
  return `${shortenedTitle}${seasonToken}${episodeToken}`;
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

function allowedAspectRatios(artTag, task = null) {
  return Object.keys(approvedArtSizesForTask(task, artTag));
}

function allowedDimensions(aspectRatio, artTag = null, task = null) {
  if (artTag) {
    return approvedArtSizesForTask(task, artTag)[aspectRatio] || [];
  }
  return [];
}

function normalizeAspectRatio(value, artTag, task = null) {
  const ratio = String(value || "").trim().toLowerCase();
  if (!allowedAspectRatios(artTag, task).includes(ratio)) {
    throw new Error("Choose an approved Aspect Ratio for the selected Art Tag.");
  }
  return ratio;
}

function normalizeDimensions(value, aspectRatio, artTag, task = null) {
  const dimensions = String(value || "").trim().toLowerCase();
  if (!/^\d+x\d+$/.test(dimensions)) {
    throw new Error("Dimensions must look like 1920x1080.");
  }
  if (!allowedDimensions(aspectRatio, artTag, task).includes(dimensions)) {
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

function baseRequiredArtSpecs(task) {
  const specs = [];
  for (const artTag of allowedArtTagCodes(task)) {
    for (const [aspectRatio, dimensions] of Object.entries(approvedArtSizesForTask(task, artTag))) {
      specs.push({ task, artTag, aspectRatio, dimensions: dimensions[0], tags: [] });
    }
  }
  return specs;
}

function dimensionArea(dimensions) {
  const [width, height] = String(dimensions).split("x").map((value) => Number.parseInt(value, 10) || 0);
  return { width, height, area: width * height };
}

function isLargerDimensions(candidate, current) {
  const next = dimensionArea(candidate);
  const prev = dimensionArea(current);
  if (next.area !== prev.area) {
    return next.area > prev.area;
  }
  if (next.width !== prev.width) {
    return next.width > prev.width;
  }
  return next.height > prev.height;
}

function requiredArtConsolidationKey(entry) {
  const variantKey = [entry.task, entry.artTag, entry.aspectRatio, entry.dimensions].join("|");
  if (PRESERVED_REQUIRED_ART_VARIANTS.has(variantKey)) {
    return variantKey;
  }
  return [entry.task, entry.artTag, entry.aspectRatio, ""].join("|");
}

function requiredArtEntries(task, rawFields) {
  const merged = new Map();
  const addEntries = (entries, tag) => {
    for (const entry of entries || []) {
      const targetTask = entry.task || task;
      const key = [targetTask, entry.artTag, entry.aspectRatio, entry.dimensions].join("|");
      if (!merged.has(key)) {
        merged.set(key, { ...entry, task: targetTask, tags: [] });
      }
      if (tag && !merged.get(key).tags.includes(tag)) {
        merged.get(key).tags.push(tag);
      }
    }
  };
  addEntries(baseRequiredArtSpecs(task), "");
  addEntries(SYNDICATION_REQUIRED_ART_SPECS[task], "syndication");
  addEntries(AXINOM_REQUIRED_ART_SPECS[task], "Axinom");
  const consolidated = new Map();
  for (const entry of merged.values()) {
    const key = requiredArtConsolidationKey(entry);
    if (!consolidated.has(key)) {
      consolidated.set(key, { ...entry, tags: [...entry.tags] });
      continue;
    }
    const current = consolidated.get(key);
    if (isLargerDimensions(entry.dimensions, current.dimensions)) {
      current.dimensions = entry.dimensions;
    }
    for (const tag of entry.tags) {
      if (!current.tags.includes(tag)) {
        current.tags.push(tag);
      }
    }
  }
  const entries = Array.from(consolidated.values()).map(({ task: targetTask, artTag, aspectRatio, dimensions, tags }) => ({
    filename: buildArtFilename(targetTask, {
      ...rawFields,
      art_tag: ART_TAG_CODE_TO_LABEL[artTag],
      aspect_ratio: aspectRatio,
      dimensions,
    }),
    tags,
  }));
  return TAGGED_REQUIRED_ART_TASKS.has(task)
    ? entries.filter((entry) => entry.tags.length)
    : entries;
}

function buildRequiredArtFilenames(task, rawFields) {
  return requiredArtEntries(task, rawFields).map(({ filename }) => filename);
}

function buildNebFilename(task, rawFields) {
  const definition = NEB_TASKS[task];
  const language = normalizeNebLanguage(rawFields.language);
  const houseLanguage = rawFields.house_language ? normalizeNebLanguage(rawFields.house_language) : language;
  const resolution = normalizeResolution(rawFields.resolution);
  const house = normalizeHouse(rawFields.house, definition.housePrefixes, houseLanguage);

  if (task === "Movie") {
    const title = normalizeNebTitle(rawFields.title);
    return `${title}_feature${movLanguageSegment(language)}_${resolution}_${house}_${nebLanguageSuffix(language)}.mov`;
  }

  if (task === "Caption") {
    const title = normalizeNebTitle(rawFields.title);
    const subtitleType = subtitleTypeForLanguage(language, rawFields.subtitle_type);
    return language === "Spanish"
      ? `${title}_feature_las_${resolution}_${house}_${subtitleType}_las.vtt`
      : `${title}_feature_${resolution}_${house}_${subtitleType}_eng.vtt`;
  }

  if (task === "Dub Audio") {
    const title = normalizeNebTitle(rawFields.title);
    if (language !== "Spanish") {
      throw new Error("Dub Audio is only supported for Spanish in the current Section 7 examples.");
    }
    return `${title}_feature_${resolution}_${house}_dub_las.wav`;
  }

  if (task === "Episode") {
    const title = normalizeNebTitle(rawFields.title);
    const season = normalizeNebSeason(rawFields.season);
    const episode = normalizeNebEpisode(rawFields.episode);
    return `${title}_${season}_${episode}${movLanguageSegment(language)}_${resolution}_${house}_${nebLanguageSuffix(language)}.mov`;
  }

  if (task === "Episode Caption") {
    const title = normalizeNebTitle(rawFields.title);
    const subtitleType = subtitleTypeForLanguage(language, rawFields.subtitle_type);
    const season = normalizeNebSeason(rawFields.season);
    const episode = normalizeNebEpisode(rawFields.episode);
    return language === "Spanish"
      ? `${title}_${season}_${episode}_las_${resolution}_${house}_${subtitleType}_las.vtt`
      : `${title}_${season}_${episode}_${resolution}_${house}_${subtitleType}_eng.vtt`;
  }

  if (task === "Original Premium Series (Yearly)") {
    const title = normalizeNebTitle(rawFields.title);
    const year = normalizeYear(rawFields.year);
    const episode = normalizeNebEpisode(rawFields.episode);
    return `${title}_s${year}_${episode}${movLanguageSegment(language)}_${resolution}_${house}_${nebLanguageSuffix(language)}.mov`;
  }

  if (task === "Exclusive Conversation (Yearly)") {
    const year = normalizeYear(rawFields.year);
    const episode = normalizeNebEpisode(rawFields.episode);
    const interviewees = normalizeInterviewees(rawFields.interviewees);
    return `exclusive_conversations_s${year}_${episode}_${interviewees}${movLanguageSegment(language)}_${resolution}_${house}_${nebLanguageSuffix(language)}.mov`;
  }

  if (task === "Virtual Screening") {
    const title = normalizeNebTitle(rawFields.title);
    return `${title}_virtual_screening${movLanguageSegment(language)}_${resolution}_${house}_${nebLanguageSuffix(language)}.mov`;
  }

  if (task === "Virtual Screening Episode") {
    const title = normalizeNebTitle(rawFields.title);
    const season = normalizeNebSeason(rawFields.season);
    const episode = normalizeNebEpisode(rawFields.episode);
    return `${title}_${season}_${episode}_virtual_screening${movLanguageSegment(language)}_${resolution}_${house}_${nebLanguageSuffix(language)}.mov`;
  }

  if (task === "Virtual Screening Episode Caption") {
    const title = normalizeNebTitle(rawFields.title);
    const subtitleType = subtitleTypeForLanguage(language, rawFields.subtitle_type);
    const season = normalizeNebSeason(rawFields.season);
    const episode = normalizeNebEpisode(rawFields.episode);
    return language === "Spanish"
      ? `${title}_${season}_${episode}_virtual_screening_las_${resolution}_${house}_${subtitleType}_las.vtt`
      : `${title}_${season}_${episode}_virtual_screening_${resolution}_${house}_${subtitleType}_eng.vtt`;
  }

  if (task === "Trailer") {
    const title = normalizeNebTitle(rawFields.title);
    return `${title}_trailer${movLanguageSegment(language)}_${resolution}_${house}_${nebLanguageSuffix(language)}.mov`;
  }

  if (task === "Trailer Caption") {
    const title = normalizeNebTitle(rawFields.title);
    const subtitleType = subtitleTypeForLanguage(language, rawFields.subtitle_type);
    return language === "Spanish"
      ? `${title}_trailer_las_${resolution}_${house}_${subtitleType}_las.vtt`
      : `${title}_trailer_${resolution}_${house}_${subtitleType}_eng.vtt`;
  }

  if (task === "Extras") {
    const title = normalizeNebTitle(rawFields.title);
    const extraPrefix = normalizeExtraUsage(rawFields.extra_usage);
    return `${title}_${extraPrefix}${movLanguageSegment(language)}_${resolution}_${house}_${nebLanguageSuffix(language)}.mov`;
  }

  throw new Error("Unsupported task type.");
}

function buildArtFilename(task, rawFields) {
  const artTag = normalizeArtTag(rawFields.art_tag);
  if (!allowedArtTagCodes(task).includes(artTag)) {
    throw new Error("Choose an allowed Art Tag for the selected art type.");
  }

  const aspectRatio = normalizeAspectRatio(rawFields.aspect_ratio, artTag, task);
  const dimensions = normalizeDimensions(rawFields.dimensions, aspectRatio, artTag, task);
  const extension = extensionForArtTag(artTag);
  const languageSegment = `_${languageSuffix(rawFields.language)}`;
  const filenameTask = ART_FILENAME_TEMPLATE_TASK[task] || task;

  if (filenameTask === "Movie") {
    const title = normalizeArtTitle(rawFields.title);
    return `${title}${languageSegment}_${artTag}_${aspectRatio}_${dimensions}.${extension}`;
  }

  if (filenameTask === "Series") {
    const title = normalizeArtTitle(rawFields.title);
    return `${title}${languageSegment}_${artTag}_${aspectRatio}_${dimensions}.${extension}`;
  }

  if (filenameTask === "Season Placeholder") {
    const title = normalizeArtTitle(rawFields.title);
    const season = normalizeNebSeason(rawFields.season);
    return `${title}_${season}${languageSegment}_${artTag}_${aspectRatio}_${dimensions}.${extension}`;
  }

  if (filenameTask === "Episode") {
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

function listTasks(domain) {
  if (domain === "neb") {
    return Object.keys(NEB_TASKS);
  }
  if (domain === "art") {
    return Object.keys(ART_TASKS);
  }
  throw new Error("Domain must be neb or art.");
}

function getTaskFields(domain, task, options = {}) {
  if (domain === "neb") {
    const definition = NEB_TASKS[task];
    if (!definition) {
      throw new Error("Unsupported NEB task type.");
    }
    return [...definition.fields];
  }
  if (domain === "art") {
    if (!ART_TASKS[task]) {
      throw new Error("Unsupported art type.");
    }
    return options.mode === "set" || options.mode === "required"
      ? requiredArtFields(task)
      : [...ART_TASKS[task]];
  }
  throw new Error("Domain must be neb or art.");
}

function buildNebCompanionCaptions(task, rawFields) {
  const captionTask = COMPANION_CAPTION_TASKS[task];
  if (!captionTask) {
    return null;
  }
  return {
    eng: buildNebFilename(captionTask, {
      ...rawFields,
      language: "English",
      house_language: rawFields.language,
      subtitle_type: SUBTITLE_DEFAULT_BY_LANGUAGE.English,
    }),
    las: buildNebFilename(captionTask, {
      ...rawFields,
      language: "Spanish",
      house_language: rawFields.language,
      subtitle_type: SUBTITLE_DEFAULT_BY_LANGUAGE.Spanish,
    }),
  };
}

function warningsForFields(rawFields) {
  return plusWarningNeeded(rawFields) ? [PLUS_WARNING_MESSAGE] : [];
}

function buildNebOutputs(task, rawFields) {
  return {
    domain: "neb",
    task,
    filename: buildNebFilename(task, rawFields),
    companionCaptions: buildNebCompanionCaptions(task, rawFields),
    externalReference: buildNebExternalReference(task, rawFields),
    warnings: warningsForFields(rawFields),
  };
}

function buildArtOutputs(task, rawFields, options = {}) {
  const mode = options.mode || "single";
  if (mode === "set" || mode === "required") {
    const entries = requiredArtEntries(task, rawFields);
    return {
      domain: "art",
      task,
      mode: "set",
      entries,
      filenames: entries.map((entry) => entry.filename),
      warnings: warningsForFields(rawFields),
    };
  }
  if (mode !== "single") {
    throw new Error("Art mode must be single or set.");
  }
  return {
    domain: "art",
    task,
    mode: "single",
    filename: buildArtFilename(task, rawFields),
    warnings: warningsForFields(rawFields),
  };
}

function validateTaskFields(domain, task, rawFields, options = {}) {
  try {
    let result;
    if (domain === "neb") {
      result = buildNebOutputs(task, rawFields);
    } else if (domain === "art") {
      result = buildArtOutputs(task, rawFields, options);
    } else {
      throw new Error("Domain must be neb or art.");
    }
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      error: error.message || "Unable to generate filename.",
    };
  }
}

export {
  ART_DEFAULTS,
  ART_DETAIL_FIELDS,
  ART_OUTPUT_MODES,
  ART_TASKS,
  ART_TAG_CODE_TO_LABEL,
  ART_TAG_TO_CODE,
  APPROVED_ART_SIZES,
  AXINOM_REQUIRED_ART_SPECS,
  COMPANION_CAPTION_TASKS,
  EXTRA_USAGE_OPTIONS,
  EXTRA_USAGE_TO_PREFIX,
  LANGUAGE_OPTIONS,
  NEB_DEFAULTS,
  NEB_SINGLE_HIDDEN_TASKS,
  NEB_TASKS,
  PLUS_WARNING_MESSAGE,
  PRESERVED_REQUIRED_ART_VARIANTS,
  RESOLUTION_OPTIONS,
  SUBTITLE_DEFAULT_BY_LANGUAGE,
  SUBTITLE_TYPE_OPTIONS,
  SYNDICATION_REQUIRED_ART_SPECS,
  TAGGED_REQUIRED_ART_TASKS,
  TASK_ART_TAG_CODES,
  allowedArtTagCodes,
  allowedArtTagLabels,
  allowedAspectRatios,
  allowedDimensions,
  buildArtFilename,
  buildArtOutputs,
  buildNebExternalReference,
  buildNebFilename,
  buildNebOutputs,
  buildRequiredArtFilenames,
  extensionForArtTag,
  getTaskFields,
  languageSuffix,
  listTasks,
  normalizeArtTag,
  normalizeExtraUsage,
  plusWarningNeeded,
  requiredArtEntries,
  requiredArtEntries as buildRequiredArtEntries,
  requiredArtFields,
  slugify,
  validateTaskFields,
};
