import * as core from "./neb_core.mjs?v=2026-10-14-profiles-v2";

export const PROFILE_VERSION = 1;
export const DEFAULT_PROFILE_ID = "neb-standard";
export const FIELD_DEFINITIONS = {
  title: { label: "Title", type: "text" },
  language: { label: "Language", type: "select", options: core.LANGUAGE_OPTIONS },
  resolution: { label: "Resolution", type: "select", options: core.RESOLUTION_OPTIONS },
  house: { label: "House Number", type: "text" },
  season: { label: "Season", type: "text" },
  episode: { label: "Episode", type: "text" },
  year: { label: "Year", type: "text" },
  interviewees: { label: "Interviewee(s)", type: "text" },
  extra_usage: { label: "Extra Type", type: "select", options: core.EXTRA_USAGE_OPTIONS },
  subtitle_type: { label: "Caption Type", type: "select", options: core.SUBTITLE_TYPE_OPTIONS },
  art_tag: { label: "Art Tag", type: "select", options: ["ca", "bg", "tt"] },
  aspect_ratio: { label: "Aspect Ratio", type: "select", options: ["16x9"] },
  dimensions: { label: "Dimensions", type: "select", options: ["3840x2160"] },
};
const TOKEN_KEYS = new Set([
  ...Object.keys(FIELD_DEFINITIONS), "extra", "caption_type", "extension", "external_reference",
  "english_media", "spanish_media", "spanish_marker",
]);
const SAMPLE = {
  ...core.NEB_DEFAULTS, ...core.ART_DEFAULTS, title: "Profile Example Title",
  season: "03", episode: "07", year: "2026", interviewees: "Profile Guest", extra_usage: "Deleted Scenes",
};

function recipeFromExample(filename, domain, language) {
  return filename
    .replaceAll("profile_example_title", "{title}")
    .replaceAll("profile_guest", "{interviewees}")
    .replaceAll("s2026", "s{year}").replaceAll("s03", "{season}").replaceAll("e07", "{episode}")
    .replace(/(?:PUR|PFP|LAS|TRL|EXT)1234567/g, "{house}")
    .replaceAll("_del", "_{extra}").replaceAll("_hd", "_{resolution}")
    .replaceAll("_cc", "_{caption_type}")
    .replaceAll("_eng", domain === "art" ? "_{language}" : language === "English" ? "_{language}" : "_{english_media}")
    .replaceAll("_es", language === "Spanish" ? "_{language}" : "_{spanish_media}")
    .replaceAll("_las", domain === "art" ? "_{language}" : "_{spanish_marker}");
}

function seedType(domain, name) {
  const fields = core.getTaskFields(domain, name).map((key) => ({ key, ...structuredClone(FIELD_DEFINITIONS[key]) }));
  if (fields.some((field) => field.key === "season")) fields.find((field) => field.key === "title").label = "Series Title";
  const type = { domain, name, baseTask: name, fields, templates: {}, variants: [], sizes: [],
    englishPrefixes: domain === "neb" ? core.NEB_TASKS[name].housePrefixes : [] };
  if (domain === "neb") {
    for (const language of core.LANGUAGE_OPTIONS) {
      const house = `${language === "Spanish" ? "LAS" : type.englishPrefixes[0]}1234567`;
      try {
        const result = core.buildNebOutputs(name, { ...SAMPLE, language, house });
        type.templates[language] = {
          filename: recipeFromExample(result.filename, domain, language),
          eng: result.companionCaptions ? recipeFromExample(result.companionCaptions.eng, domain, "English") : "",
          las: result.companionCaptions ? recipeFromExample(result.companionCaptions.las, domain, "Spanish") : "",
          reference: "{external_reference}",
        };
      } catch (error) {
        // Dub Audio has no English recipe in the standard conventions.
        if (name !== "Dub Audio" || language !== "English") throw error;
        type.templates[language] = { filename: "", eng: "", las: "", reference: "" };
      }
    }
  } else {
    for (const artTag of core.allowedArtTagCodes(name)) {
      for (const ratio of core.allowedAspectRatios(artTag, name)) {
        for (const dimensions of core.allowedDimensions(ratio, artTag, name)) {
          type.sizes.push({ artTag, aspectRatio: ratio, dimensions });
        }
      }
    }
    const first = type.sizes[0];
    for (const language of core.LANGUAGE_OPTIONS) {
      const filename = core.buildArtFilename(name, { ...SAMPLE, language,
        art_tag: first.artTag, aspect_ratio: first.aspectRatio, dimensions: first.dimensions });
      type.templates[language] = { filename: recipeFromExample(filename, domain, language)
        .replace(`_${first.artTag}_${first.aspectRatio}_${first.dimensions}`, "_{art_tag}_{aspect_ratio}_{dimensions}")
        .replace(/\.(jpg|png)$/, ".{extension}"), eng: "", las: "", reference: "" };
    }
    type.variants = core.requiredArtEntries(name, { ...SAMPLE, language: "English" }).map((entry) => {
      const match = entry.filename.match(/_(ca|bg|tt)_(\d+x\d+)_(\d+x\d+)\.(jpg|png)$/);
      if (!match) throw new Error(`Cannot read required art variant for ${name}.`);
      return { artTag: match[1], aspectRatio: match[2], dimensions: match[3], tags: entry.tags };
    });
  }
  return type;
}

export function defaultProfile() {
  return { version: PROFILE_VERSION, id: DEFAULT_PROFILE_ID, name: "NEB Standard", rules: {
    titleCase: "lower", separator: "_", stripAccents: true, apostrophes: "remove", plus: "context",
    ampersand: "and", at: "at", englishMedia: "eng", spanishMedia: "es", englishArt: "eng", spanishArt: "las",
    spanishMarker: "las", englishCaption: "cc", spanishCaption: "cc", spanishPrefixes: ["LAS"], houseDigits: 7,
  }, types: [
    ...core.listTasks("neb").filter((name) => !core.NEB_SINGLE_HIDDEN_TASKS.has(name)).map((name) => seedType("neb", name)),
    ...core.listTasks("art").map((name) => seedType("art", name)),
  ] };
}

export function profileType(profile, domain, name) {
  const type = profile.types.find((item) => item.domain === domain && item.name === name);
  if (!type) throw new Error("Choose a type in this naming profile.");
  return type;
}

export function profileFields(profile, domain, name, mode = "single") {
  return profileType(profile, domain, name).fields
    .filter((field) => !(domain === "art" && mode === "set" && ["art_tag", "aspect_ratio", "dimensions"].includes(field.key)));
}

export function typeLanguage(type, values) {
  return type.fields.some((field) => field.key === "language") ? values.language || "English" : "English";
}

export function profileOptions(profile, type, field, values) {
  if (type.domain === "art") {
    const tag = String(values.art_tag || "").split(" ")[0];
    const sizes = type.sizes;
    if (field === "art_tag") return [...new Set(sizes.map((row) => row.artTag))];
    if (field === "aspect_ratio") return [...new Set(sizes.filter((row) => row.artTag === tag).map((row) => row.aspectRatio))];
    if (field === "dimensions") return [...new Set(sizes.filter((row) => row.artTag === tag && row.aspectRatio === values.aspect_ratio).map((row) => row.dimensions))];
  }
  return type.fields.find((item) => item.key === field)?.options || [];
}

export function profileSlug(value, rules, domain = "art") {
  let text = String(value).trim();
  if (rules.stripAccents) text = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  text = text.replace(/['\u2019]/g, rules.apostrophes === "remove" ? "" : " ");
  text = text.replace(/&/g, ` ${rules.ampersand} `).replace(/@/g, ` ${rules.at} `);
  if (rules.plus === "context") text = text.replace(/\s+\+\s+/g, " and ").replace(/\+/g, " plus ");
  else text = text.replace(/\+/g, ` ${rules.plus} `);
  text = text.replace(/([\p{L}\p{N}])\.\.\.(?=[\p{L}\p{N}])/gu, "$1 ")
    .replace(/[\u00b7*!.\u00a0]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/ +/g, rules.separator);
  if (rules.titleCase === "lower") text = text.toLowerCase();
  if (rules.titleCase === "upper") text = text.toUpperCase();
  if (domain === "neb") text = text.replace(new RegExp(`veggie${rules.separator}tales`, "i"), "veggietales");
  return text;
}

function tokensFor(profile, type, rawFields) {
  const rules = profile.rules;
  const values = Object.create(null);
  for (const field of type.fields) {
    const value = String(rawFields[field.key] ?? "").trim();
    if (!value) throw new Error(`${field.label} is required.`);
    if (field.type === "select" && !profileOptions(profile, type, field.key, rawFields).includes(value)) {
      throw new Error(`Choose an allowed ${field.label.toLowerCase()}.`);
    }
    values[field.key] = field.type === "select" ? value : profileSlug(value, rules, type.domain);
    if (!values[field.key]) throw new Error(`${field.label} needs letters or numbers.`);
  }
  const language = typeLanguage(type, rawFields);
  if (!["English", "Spanish"].includes(language)) throw new Error("Choose English or Spanish.");
  values.language = type.domain === "art"
    ? (language === "Spanish" ? rules.spanishArt : rules.englishArt)
    : (language === "Spanish" ? rules.spanishMedia : rules.englishMedia);
  values.english_media = rules.englishMedia;
  values.spanish_media = rules.spanishMedia;
  values.spanish_marker = rules.spanishMarker;
  values.caption_type = language === "Spanish" ? rules.spanishCaption : rules.englishCaption;
  if (rawFields.subtitle_type) values.caption_type = rawFields.subtitle_type;
  for (const field of ["season", "episode"]) {
    if (rawFields[field] === undefined || !type.fields.some((item) => item.key === field)) continue;
    const numeric = String(rawFields[field]).replace(/^[se]/i, "");
    if (!/^\d+$/.test(numeric) || Number(numeric) < 1 || Number(numeric) > 999) throw new Error(`${field} must be between 1 and 999.`);
    values[field] = `${field[0]}${String(Number(numeric)).padStart(2, "0")}`;
  }
  if (values.year && !/^\d{4}$/.test(String(rawFields.year))) throw new Error("Year must be 4 digits.");
  if (type.fields.some((field) => field.key === "house")) {
    const house = String(rawFields.house).toUpperCase();
    const prefixes = language === "Spanish" ? rules.spanishPrefixes : type.englishPrefixes;
    const match = house.match(new RegExp(`^([A-Z]{3})(\\d{${rules.houseDigits}})$`));
    if (!match || !prefixes.includes(match[1])) throw new Error(`House Number must start with ${prefixes.join(", ")} and have ${rules.houseDigits} digits.`);
    values.house = house;
  }
  values.extra = core.EXTRA_USAGE_TO_PREFIX[rawFields.extra_usage] || values.extra_usage || "";
  values.art_tag = String(rawFields.art_tag || "").split(" ")[0];
  values.aspect_ratio = rawFields.aspect_ratio || "";
  values.dimensions = rawFields.dimensions || "";
  values.extension = values.art_tag === "tt" ? "png" : "jpg";
  if (type.domain === "neb" && Object.values(type.templates).some((recipes) => recipes.reference.includes("{external_reference}"))) {
    values.external_reference = core.buildNebExternalReference(type.baseTask || "Movie", {
      ...rawFields, title: rawFields.title || type.name,
    });
  }
  return values;
}

export function renderRecipe(recipe, tokens, separator = "_") {
  const filename = recipe.replace(/\{([a-z][a-z0-9_]*)\}/g, (_, key) => {
    if (!Object.hasOwn(tokens, key) || !tokens[key]) throw new Error(`The recipe needs a value for {${key}}.`);
    return tokens[key];
  });
  if (/[{}\\/:*?"<>|\u0000-\u001f]/.test(filename) || /[. ]$/.test(filename) || !filename || filename.length > 240
    || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename)) {
    throw new Error("The recipe produced an invalid filename. Check the recipe in Advanced Settings.");
  }
  return filename.replace(/_+/g, separator).replace(/-+/g, "-");
}

export function profileNebOutputs(profile, task, rawFields) {
  if (profile.id === DEFAULT_PROFILE_ID) return core.buildNebOutputs(task, rawFields);
  const type = profileType(profile, "neb", task);
  const tokens = tokensFor(profile, type, rawFields);
  const recipes = type.templates[typeLanguage(type, rawFields)];
  if (!recipes.filename) throw new Error("This type has no recipe for the selected language.");
  const render = (recipe, extra = {}) => recipe ? renderRecipe(recipe, { ...tokens, ...extra }, profile.rules.separator) : "";
  return { filename: render(recipes.filename), externalReference: render(recipes.reference), companionCaptions:
    recipes.eng || recipes.las ? {
      eng: render(recipes.eng, { language: profile.rules.englishMedia, caption_type: profile.rules.englishCaption }),
      las: render(recipes.las, { language: profile.rules.spanishMedia, caption_type: profile.rules.spanishCaption }),
    } : null };
}

export function profileArtEntries(profile, task, rawFields, { mode = "set", multiple = false } = {}) {
  const episodes = multiple ? core.parseArtEpisodes(rawFields.episodes) : [rawFields.episode];
  if (profile.id === DEFAULT_PROFILE_ID) {
    return episodes.flatMap((episode) => mode === "set"
      ? core.requiredArtEntries(task, { ...rawFields, episode })
      : [{ filename: core.buildArtFilename(task, { ...rawFields, episode }), tags: [] }]);
  }
  const type = profileType(profile, "art", task);
  const variants = mode === "set" ? type.variants : [{
    artTag: rawFields.art_tag, aspectRatio: rawFields.aspect_ratio, dimensions: rawFields.dimensions, tags: [],
  }];
  if (!variants.length) throw new Error("Add required art variants for this type in Advanced Settings.");
  return episodes.flatMap((episode) => variants.map((variant) => {
    const fields = { ...rawFields, episode, art_tag: variant.artTag, aspect_ratio: variant.aspectRatio, dimensions: variant.dimensions };
    const tokens = tokensFor(profile, type, fields);
    return { filename: renderRecipe(type.templates[typeLanguage(type, fields)].filename, tokens, profile.rules.separator), tags: variant.tags || [] };
  }));
}

export function validateProfile(profile) {
  if (!profile || profile.version !== PROFILE_VERSION || typeof profile.id !== "string" || !/^[a-z0-9-]{1,100}$/i.test(profile.id)
    || typeof profile.name !== "string" || !profile.name.trim() || profile.name.length > 100) throw new Error("Enter a valid profile name (up to 100 characters) and ID.");
  if (profile.id === DEFAULT_PROFILE_ID) throw new Error("NEB Standard is protected. Make an editable copy.");
  const rules = profile.rules;
  if (!rules || !["lower", "upper", "preserve"].includes(rules.titleCase) || !["_", "-"].includes(rules.separator)
    || !["context", "and", "plus"].includes(rules.plus) || !["remove", "space"].includes(rules.apostrophes)
    || typeof rules.stripAccents !== "boolean" || !Number.isInteger(rules.houseDigits) || rules.houseDigits < 1 || rules.houseDigits > 20) throw new Error("Check the profile's title and house number rules.");
  for (const key of ["ampersand", "at", "englishMedia", "spanishMedia", "englishArt", "spanishArt", "spanishMarker", "englishCaption", "spanishCaption"]) {
    if (typeof rules[key] !== "string" || !/^[a-zA-Z0-9_-]{1,30}$/.test(rules[key])) throw new Error(`Use letters, numbers, underscores or hyphens for ${key}.`);
  }
  if (!Array.isArray(rules.spanishPrefixes) || !rules.spanishPrefixes.length || rules.spanishPrefixes.some((prefix) => !/^[A-Z]{3}$/.test(prefix))) throw new Error("House prefixes must each be 3 capital letters.");
  if (!Array.isArray(profile.types) || !profile.types.length || profile.types.length > 100) throw new Error("A profile needs between 1 and 100 types.");
  if (!["neb", "art"].every((domain) => profile.types.some((type) => type.domain === domain))) throw new Error("Keep at least one video type and one art type in the profile.");
  const names = new Set();
  for (const type of profile.types) {
    if (!["neb", "art"].includes(type.domain) || typeof type.name !== "string" || !type.name.trim() || type.name.length > 100) throw new Error("Give each type a name and a section.");
    const unique = `${type.domain}:${type.name}`;
    if (names.has(unique)) throw new Error("Type names must be unique within each section.");
    names.add(unique);
    if (type.baseTask && !core.listTasks(type.domain).includes(type.baseTask)) throw new Error("Unknown base type.");
    if (!Array.isArray(type.fields) || !type.fields.length || type.fields.length > 30) throw new Error("Each type needs 1 to 30 fields.");
    const keys = new Set();
    for (const field of type.fields) {
      if (typeof field.key !== "string" || !/^[a-z][a-z0-9_]*$/.test(field.key) || ["constructor", "prototype", "__proto__"].includes(field.key) || keys.has(field.key)
        || typeof field.label !== "string" || !field.label.trim() || !["text", "select"].includes(field.type)) throw new Error("Check the field names, labels and types.");
      if (field.type === "select" && (!Array.isArray(field.options) || !field.options.length || field.options.some((value) => typeof value !== "string" || !value))) throw new Error("Choice fields need a list of options.");
      keys.add(field.key);
    }
    if (!Array.isArray(type.englishPrefixes) || type.englishPrefixes.some((prefix) => !/^[A-Z]{3}$/.test(prefix)) || (keys.has("house") && !type.englishPrefixes.length)) throw new Error("A house number field needs English prefixes.");
    for (const language of core.LANGUAGE_OPTIONS) {
      if (!type.templates?.[language]) throw new Error("Each type needs recipes for both languages.");
      for (const key of ["filename", "eng", "las", "reference"]) {
        const recipe = type.templates[language][key];
        if (typeof recipe !== "string" || recipe.length > 1000 || /[\\/:*?"<>|\u0000-\u001f]/.test(recipe)) throw new Error("Use a filename recipe with no path characters.");
        const remaining = recipe.replace(/\{([a-z][a-z0-9_]*)\}/g, (_, token) => {
          if (!TOKEN_KEYS.has(token) && !keys.has(token)) throw new Error(`Unknown recipe token: {${token}}.`);
          return "";
        });
        if (/[{}]/.test(remaining)) throw new Error("Recipe tokens need matching braces, for example {title}.");
      }
    }
    if (!type.templates.English.filename && !type.templates.Spanish.filename) throw new Error("Add a filename recipe for at least one language.");
    if (type.domain === "art") {
      if (!Array.isArray(type.sizes) || !type.sizes.length || !Array.isArray(type.variants)) throw new Error("Art types need allowed sizes and a required variant list.");
      for (const row of [...type.sizes, ...type.variants]) {
        if (!/^[a-z0-9]{1,10}$/.test(row.artTag) || !/^[1-9]\d{0,4}x[1-9]\d{0,4}$/.test(row.aspectRatio) || !/^[1-9]\d{0,4}x[1-9]\d{0,4}$/.test(row.dimensions)) throw new Error("Art rows need a tag, aspect ratio and dimensions, for example bg | 16x9 | 3840x2160.");
        if (row.tags && (!Array.isArray(row.tags) || row.tags.some((tag) => typeof tag !== "string" || tag.length > 100))) throw new Error("Check the art requirement tags.");
      }
      if (type.variants.some((row) => !type.sizes.some((size) => size.artTag === row.artTag && size.aspectRatio === row.aspectRatio && size.dimensions === row.dimensions))) throw new Error("Every required art variant must also be in allowed sizes.");
    }
  }
  return profile;
}

export function editableCopy(profile, name = `${profile.name} Copy`) {
  return { ...structuredClone(profile), id: crypto.randomUUID(), name };
}
