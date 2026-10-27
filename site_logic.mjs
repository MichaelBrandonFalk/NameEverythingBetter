import {
  ART_DEFAULTS,
  ART_OUTPUT_MODES,
  ART_TASKS,
  ART_TASK_DEFAULT_OVERRIDES,
  COMPANION_CAPTION_TASKS,
  EXTRA_USAGE_OPTIONS,
  LANGUAGE_OPTIONS,
  NEB_DEFAULTS,
  NEB_SINGLE_HIDDEN_TASKS,
  NEB_TASKS,
  PLUS_WARNING_MESSAGE,
  RESOLUTION_OPTIONS,
  SUBTITLE_DEFAULT_BY_LANGUAGE,
  SUBTITLE_TYPE_OPTIONS,
  TAGGED_REQUIRED_ART_TASKS,
  allowedArtTagLabels,
  allowedAspectRatios,
  allowedDimensions,
  buildArtFilename,
  buildEpisodeArtEntries,
  buildNebExternalReference,
  buildNebFilename,
  buildNebOutputs,
  buildRequiredArtFilenames,
  defaultArtValuesForTask,
  normalizeArtTag,
  plusWarningNeeded,
  requiredArtEntries,
  requiredArtFields,
  slugify,
} from "./neb_core.mjs?v=2026-10-27-vertical";

import { defaultProfile, profileType, profileFields, profileOptions, profileNebOutputs, profileArtEntries, typeLanguage, DEFAULT_PROFILE_ID } from "./naming_profiles.mjs?v=2026-10-27-vertical";
import { initializeProfiles } from "./profile_settings.mjs?v=2026-10-27-profile-rules";
import { copyText, saveText } from "./desktop_bridge.mjs?v=2026-10-27-vertical";
import { batchEpisodeInputs, bindEpisodeUpload, episodeSelectionHtml, houseInputsHtml, outputRows, spreadsheetRows, verticalOutputsHtml, validateOutputRows } from "./episode_workflow.mjs?v=2026-10-27-vertical";
import { downloadSpreadsheet } from "./spreadsheet_export.mjs?v=2026-10-27-vertical";

let activeProfile = defaultProfile();

function selectedProfileType() {
  return profileType(activeProfile, state.domain, getDomainState().task);
}

export {
  buildArtFilename,
  buildNebExternalReference,
  buildNebFilename,
  buildNebOutputs,
  buildRequiredArtFilenames,
  defaultArtValuesForTask,
  requiredArtEntries,
} from "./neb_core.mjs?v=2026-10-27-vertical";

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
    "Vertical Episodes": { title: "Series Title *" },
    "Episode Caption": { title: "Series Title *" },
    "Virtual Screening Episode": { title: "Series Title *" },
    "Virtual Screening Episode Caption": { title: "Series Title *" },
  },
  art: {
    "Season Placeholder": { title: "Series Title *" },
    "Episode": { title: "Series Title *" },
    "Virtual Screening Episode": { title: "Series Title *" },
    "Podcast Episodes": { title: "Series Title *" },
    "Familia Mini-Novelas Episodes": { title: "Series Title *" },
  },
};

const state = {
  domain: null,
  neb: { task: "Movie", values: { ...NEB_DEFAULTS }, subtitleManual: false, englishCaptionRevealed: false,
    episodeMode: "single", episodeHouses: {}, includeEnglish: false, batchRows: [], singleOutput: null, inputMode: "manual", uploadRows: [] },
  art: { task: "Movie", values: { ...ART_DEFAULTS, episodes: "" }, outputMode: "set", episodeMode: "single" },
};

function optionsForField(domain, field, task, values) {
  if (activeProfile.id !== DEFAULT_PROFILE_ID) return profileOptions(activeProfile, profileType(activeProfile, domain, task), field, values);
  if (field === "language") return LANGUAGE_OPTIONS;
  if (field === "subtitle_type") return domain === "neb" && values.language === "Spanish" ? ["cc"] : SUBTITLE_TYPE_OPTIONS;
  if (field === "resolution") return RESOLUTION_OPTIONS;
  if (field === "extra_usage") return EXTRA_USAGE_OPTIONS;
  if (field === "art_tag") return allowedArtTagLabels(task);
  if (field === "aspect_ratio") {
    const artTag = normalizeArtTag(values.art_tag || allowedArtTagLabels(task)[0]);
    return allowedAspectRatios(artTag, task);
  }
  if (field === "dimensions") {
    const artTag = normalizeArtTag(values.art_tag || allowedArtTagLabels(task)[0]);
    const ratio = values.aspect_ratio && allowedAspectRatios(artTag, task).includes(values.aspect_ratio)
      ? values.aspect_ratio
      : allowedAspectRatios(artTag, task)[0];
    return allowedDimensions(ratio, artTag, task);
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
    document.getElementById("filename-output-external-reference"),
  ];
  status.textContent = "";
  status.className = "status hidden";
  outputs.forEach((output) => {
    delete output.dataset.copyValue;
    output.innerHTML = "";
    output.textContent = "";
  });
  state.neb.englishCaptionRevealed = false;
  state.neb.batchRows = [];
  state.neb.singleOutput = null;
  document.getElementById("vertical-output").textContent = "";
  document.getElementById("episode-batch-output").textContent = "Generate names to prepare an Excel spreadsheet for the selected episodes.";
  if (state.domain === "neb") refreshOutputVisibility();
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
  return activeProfile.types.filter((type) => type.domain === state.domain).map((type) => type.name);
}

function currentDefaults() {
  return state.domain === "neb" ? NEB_DEFAULTS : defaultArtValuesForTask(state.art.task);
}

function applyArtTaskDefaultOverrides(taskState) {
  Object.assign(taskState.values, ART_TASK_DEFAULT_OVERRIDES[taskState.task] || {});
}

function normalizeArtDependentValues(taskState) {
  if (activeProfile.id !== DEFAULT_PROFILE_ID) {
    for (const field of ["art_tag", "aspect_ratio", "dimensions"]) {
      const options = optionsForField("art", field, taskState.task, taskState.values);
      if (options.length && !options.includes(taskState.values[field])) taskState.values[field] = options[0];
    }
    return;
  }
  const task = taskState.task;
  const allowedTags = allowedArtTagLabels(task);
  if (!allowedTags.includes(taskState.values.art_tag)) {
    [taskState.values.art_tag] = allowedTags;
  }
  const artTagCode = normalizeArtTag(taskState.values.art_tag);
  const ratios = allowedAspectRatios(artTagCode, task);
  if (!ratios.includes(taskState.values.aspect_ratio)) {
    [taskState.values.aspect_ratio] = ratios;
  }
  const dims = allowedDimensions(taskState.values.aspect_ratio, artTagCode, task);
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
  taskSelect.innerHTML = taskNames.map((taskName) => `<option value="${escapeHtml(taskName)}">${escapeHtml(taskName)}</option>`).join("");
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

  const taskFields = profileFields(activeProfile, state.domain, domainState.task, domainState.outputMode).map((field) => field.key);
  fields.innerHTML = taskFields.filter((field) => !isNebBatch() || (domainState.inputMode === "upload" ? field === "episode" : field !== "house")).map((field) => renderField(field, domainState)).join("");
  if (isNebBatch()) {
    fields.insertAdjacentHTML("beforeend", '<div id="batch-houses" class="field full"></div>');
    renderBatchHouses();
  }
  bindFieldHandlers(taskFields);
  const episodeMode = document.getElementById("episode-mode");
  if (episodeMode) {
    episodeMode.value = domainState.episodeMode;
    episodeMode.addEventListener("change", (event) => {
      domainState.episodeMode = event.target.value;
      renderBuilder();
      resetOutput();
    });
    const episodes = document.getElementById("field-episodes");
    if (episodes) episodes.addEventListener("input", onFieldInput);
  }
  refreshOutputVisibility();
  if (state.domain === "neb") bindEpisodeUpload(domainState, selectedProfileType().fields, () => { renderBuilder(); resetOutput(); }, setStatus);
}

function renderField(field, domainState) {
  const profileField = selectedProfileType().fields.find((item) => item.key === field);
  const config = activeProfile.id === DEFAULT_PROFILE_ID ? FIELD_CONFIG[field] : {
    ...FIELD_CONFIG[field], ...profileField, full: field === "title" || field === "interviewees",
  };
  const task = domainState.task;
  const value = domainState.values[field] ?? "";
  const classes = config.full ? "field full" : "field";
  const label = activeProfile.id === DEFAULT_PROFILE_ID
    ? TASK_FIELD_LABEL_OVERRIDES[state.domain]?.[task]?.[field] || config.label
    : `${escapeHtml(config.label)} *`;

  if (state.domain === "neb" && field === "episode") return episodeSelectionHtml(domainState, label);
  if (state.domain === "art" && task === "Episode" && field === "episode") {
    const multiple = domainState.episodeMode === "multiple";
    const inputField = multiple ? "episodes" : "episode";
    return `
      <div class="${classes}">
        <label for="episode-mode">Episode Selection</label>
        <select id="episode-mode">
          <option value="single">Single Episode</option>
          <option value="multiple">Multiple Episodes</option>
        </select>
        <label for="field-${inputField}">${multiple ? "Episodes *" : label}</label>
        <input id="field-${inputField}" data-field="${inputField}" type="text"
          value="${escapeHtml(String(domainState.values[inputField] || ""))}"
          ${multiple ? 'placeholder="3,7,8 or 1-89" aria-describedby="episodes-help"' : 'inputmode="numeric"'}>
        ${multiple ? '<small id="episodes-help">Use commas or ranges, for example 3,7,8 or 1-89.</small>' : ""}
      </div>
    `;
  }

  if (config.type === "select") {
    const options = optionsForField(state.domain, field, task, domainState.values);
    const resolvedValue = options.includes(value) ? value : options[0];
    domainState.values[field] = resolvedValue;
    const optionsHtml = options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("");
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

function renderVideoOutput(value) {
  const output = document.getElementById("filename-output-video");
  if (state.domain === "art" && (getDomainState().outputMode === "set" || isMultipleEpisodeArt())) {
    const rows = String(value).split("\n").filter(Boolean);
    output.dataset.copyValue = rows.join("\n");
    output.innerHTML = `
      <div class="filename-list">
        ${rows.map((row) => `
          <div class="filename-line">
            <span class="filename-line-text">${escapeHtml(row)}</span>
            <button class="copy-icon-btn" type="button" data-inline-copy="${escapeHtml(row)}" data-inline-copy-label="Art Filename" aria-label="Copy Art Filename" title="Copy Art Filename">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1Zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H10V7h9v14Z"/></svg>
            </button>
          </div>
        `).join("")}
      </div>
    `;
    return;
  }
  delete output.dataset.copyValue;
  output.textContent = value;
}

function outputText(targetId) {
  const output = document.getElementById(targetId);
  if (!output) return "";
  return output.dataset.copyValue || output.textContent.trim();
}

function refreshOutputVisibility() {
  const recipes = state.domain === "neb" ? selectedProfileType().templates[typeLanguage(selectedProfileType(), getDomainState().values)] : null;
  const hasCompanionCaptions = Boolean(recipes?.eng || recipes?.las);
  const outputLabel = document.getElementById("output-video-label");
  const outputNote = document.getElementById("output-note");
  const downloadBtn = document.getElementById("download-btn");
  const generateBtn = document.getElementById("generate-btn");
  const copyVideoBtn = document.getElementById("copy-video-btn");
  document.getElementById("output-video-wrap").classList.remove("hidden");
  const batch = isNebBatch();
  document.getElementById("single-output-stack").classList.toggle("hidden", batch);
  document.getElementById("episode-batch-output").classList.toggle("hidden", !batch);
  if (state.domain === "neb") {
    const videoLabel = activeProfile.id === DEFAULT_PROFILE_ID ? "MOV Name" : "Video Name";
    outputLabel.textContent = videoLabel;
    copyVideoBtn.dataset.copyLabel = videoLabel;
    copyVideoBtn.setAttribute("aria-label", `Copy ${videoLabel}`);
    copyVideoBtn.setAttribute("title", `Copy ${videoLabel}`);
    const spanish = typeLanguage(selectedProfileType(), getDomainState().values) === "Spanish";
    const revealEnglish = !spanish || state.neb.englishCaptionRevealed;
    const englishToggle = document.getElementById("english-caption-toggle");
    englishToggle.classList.toggle("hidden", !spanish);
    englishToggle.textContent = revealEnglish ? "Hide English Caption" : "Show English Caption";
    englishToggle.setAttribute("aria-expanded", String(revealEnglish));
    document.getElementById("english-caption-label").classList.toggle("hidden", spanish);
    document.getElementById("filename-output-caption-eng").classList.toggle("hidden", !revealEnglish);
    document.getElementById("copy-caption-eng-btn").classList.toggle("hidden", !revealEnglish);
    outputNote.textContent = activeProfile.id !== DEFAULT_PROFILE_ID
      ? "These outputs use the selected naming profile. English captions can be revealed when Spanish is selected."
      : spanish
      ? "The tool shows the MOV name, Spanish caption, and external reference. Click Show English Caption if you need it."
      : "For supported video tasks, the tool shows the MOV name, both caption names, and the external reference together.";
    downloadBtn.classList.toggle("hidden", !batch);
    downloadBtn.textContent = "Download Spreadsheet (.xlsx)";
    generateBtn.textContent = batch ? "Generate Spreadsheet" : "Generate Name";
    if (batch) outputNote.textContent = "Generate the selected episodes, then download their filenames as an Excel spreadsheet.";
    document.getElementById("vertical-output").innerHTML = verticalOutputsHtml(state.neb.singleOutput?.vertical, {
      language: typeLanguage(selectedProfileType(), state.neb.values), showEnglish: revealEnglish,
    });
    document.getElementById("output-caption-eng-wrap").classList.toggle("hidden", !hasCompanionCaptions || !recipes.eng);
    document.getElementById("output-caption-las-wrap").classList.toggle("hidden", !hasCompanionCaptions || !recipes.las);
    document.getElementById("output-external-reference-wrap").classList.toggle("hidden", !recipes.reference);
  } else {
    const artOutputLabel = getDomainState().outputMode === "set" ? "Required Art Names" : "Art Filename";
    outputLabel.textContent = artOutputLabel;
    copyVideoBtn.dataset.copyLabel = artOutputLabel;
    copyVideoBtn.setAttribute("aria-label", `Copy ${artOutputLabel}`);
    copyVideoBtn.setAttribute("title", `Copy ${artOutputLabel}`);
    outputNote.textContent = getDomainState().outputMode === "set"
      ? (TAGGED_REQUIRED_ART_TASKS.has(getDomainState().task)
        ? "This required set includes the standard list plus any Axinom and syndication additions for this art type."
        : "This required set uses the highest resolution for each required art type and aspect ratio.")
      : "Switch to one-at-a-time if you need a single custom art filename.";
    downloadBtn.classList.remove("hidden");
    downloadBtn.textContent = "Download CSV";
    generateBtn.textContent = getDomainState().outputMode === "set" || isMultipleEpisodeArt() ? "Generate Names" : "Generate Name";
    document.getElementById("output-caption-eng-wrap").classList.add("hidden");
    document.getElementById("output-caption-las-wrap").classList.add("hidden");
    document.getElementById("output-external-reference-wrap").classList.add("hidden");
  }
}

function bindFieldHandlers(taskFields) {
  taskFields.forEach((field) => {
    const el = document.getElementById(`field-${field}`);
    if (!el) return;
    if (el.tagName === "SELECT" && !getDomainState().values[field]) getDomainState().values[field] = el.options[0]?.value || "";
    el.value = getDomainState().values[field] ?? "";
    el.addEventListener("input", onFieldInput);
    el.addEventListener("change", onFieldInput);
  });
}

function onFieldInput(event) {
  const field = event.target.dataset.field;
  const domainState = getDomainState();
  domainState.values[field] = event.target.value;
  if (state.domain === "neb" && (field === "episodes" || field === "language")) renderBatchHouses();

  if (state.domain === "neb" && field === "subtitle_type") {
    domainState.subtitleManual = true;
  }

  if (state.domain === "neb" && field === "language" && ["Caption", "Episode Caption", "Trailer Caption", "Virtual Screening Episode Caption"].includes(domainState.task)) {
    if (event.target.value === "Spanish" || !domainState.subtitleManual) {
      domainState.values.subtitle_type = SUBTITLE_DEFAULT_BY_LANGUAGE[event.target.value] || "cc";
      domainState.subtitleManual = false;
    }
    renderBuilder();
    resetOutput();
    return;
  }

  if (state.domain === "art" && (field === "art_tag" || field === "aspect_ratio")) {
    renderBuilder();
    resetOutput();
    return;
  }

  resetOutput();
}

function onTaskChange(event) {
  const domainState = getDomainState();
  domainState.task = event.target.value;
  if (state.domain === "neb") {
    domainState.subtitleManual = false;
    domainState.values.language = selectedProfileType().defaultLanguage || domainState.values.language || "English";
    domainState.episodeHouses = {};
    domainState.uploadRows = [];
    const language = domainState.values.language || "English";
    domainState.values.subtitle_type = SUBTITLE_DEFAULT_BY_LANGUAGE[language] || "cc";
  } else {
    applyArtTaskDefaultOverrides(domainState);
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
    state.neb.values.language = selectedProfileType().defaultLanguage || defaults.language;
    state.neb.episodeHouses = {};
    state.neb.uploadRows = [];
  } else {
    const currentMode = state.art.outputMode;
    state.art.values = { ...defaults };
    state.art.outputMode = currentMode;
    state.art.values.episodes = "";
  }
  renderBuilder();
  resetOutput();
}

function generateCurrentFilename() {
  const domainState = getDomainState();
  try {
    let filename;
    let companionCaptions = null;
    let externalReference = "";
    if (state.domain === "neb") {
      if (isNebBatch()) {
        const fields = batchEpisodeInputs(domainState, {
          needsHouse: selectedProfileType().fields.some((field) => field.key === "house"),
        });
        const rows = fields.flatMap((values) => outputRows(profileNebOutputs(activeProfile, domainState.task, values), values, { includeEnglish: domainState.includeEnglish }));
        domainState.batchRows = validateOutputRows(rows);
        document.getElementById("episode-batch-output").textContent = `${fields.length} episodes / ${rows.length} files ready. Download the spreadsheet below.`;
        setStatus(fields.some(plusWarningNeeded) ? `Episode spreadsheet is ready. ${PLUS_WARNING_MESSAGE}` : "Episode spreadsheet is ready.", fields.some(plusWarningNeeded) ? "warning" : "success");
        return;
      }
      const outputs = profileNebOutputs(activeProfile, domainState.task, domainState.values);
      domainState.singleOutput = outputs;
      filename = outputs.filename;
      companionCaptions = outputs.companionCaptions;
      externalReference = outputs.externalReference;
      refreshOutputVisibility();
    } else {
      filename = currentArtEntries().map((entry) => entry.filename).join("\n");
    }

    renderVideoOutput(filename);
    document.getElementById("filename-output-caption-eng").textContent = companionCaptions?.eng || "";
    document.getElementById("filename-output-caption-las").textContent = companionCaptions?.las || "";
    document.getElementById("filename-output-external-reference").textContent = externalReference;
    if (plusWarningNeeded(domainState.values)) {
      setStatus(`Names generated. ${PLUS_WARNING_MESSAGE}`, "warning");
    } else {
      setStatus("Names generated.", "success");
    }
  } catch (error) {
    state.neb.batchRows = [];
    state.neb.singleOutput = null;
    document.getElementById("vertical-output").textContent = "";
    document.getElementById("episode-batch-output").textContent = "Check the episode details before downloading.";
    renderVideoOutput("");
    document.getElementById("filename-output-caption-eng").textContent = "";
    document.getElementById("filename-output-caption-las").textContent = "";
    document.getElementById("filename-output-external-reference").textContent = "";
    setStatus(error.message || "Unable to generate filename.", "error");
  }
}

async function copyFilename(targetId, label) {
  const text = outputText(targetId);
  if (!text) {
    setStatus(`Generate ${label.toLowerCase()} first.`, "error");
    return;
  }
  try {
    await copyText(text);
    setStatus(`${label} copied.`, "success");
  } catch {
    setStatus(`Clipboard access was blocked. Copy the ${label.toLowerCase()} manually.`, "warning");
  }
}

function isMultipleEpisodeArt() {
  return state.art.task === "Episode" && state.art.episodeMode === "multiple";
}

function isNebBatch() {
  return state.domain === "neb" && state.neb.episodeMode === "multiple" && selectedProfileType().fields.some((field) => field.key === "episode");
}

function renderBatchHouses() {
  const container = document.getElementById("batch-houses");
  if (!container || !isNebBatch()) return;
  container.innerHTML = houseInputsHtml(state.neb, { needsHouse: selectedProfileType().fields.some((field) => field.key === "house") });
  container.querySelector('.field-grid')?.classList.add('batch-house-fields');
  container.querySelectorAll("[data-episode-house]").forEach((input) => input.addEventListener("input", () => {
    state.neb.episodeHouses[input.dataset.episodeHouse] = input.value;
    resetOutput();
  }));
  container.querySelector("#batch-include-english")?.addEventListener("change", (event) => {
    state.neb.includeEnglish = event.target.checked; resetOutput();
  });
}

function currentArtEntries() {
  return profileArtEntries(activeProfile, state.art.task, state.art.values, {
    mode: state.art.outputMode, multiple: isMultipleEpisodeArt(),
  });
}

async function downloadCurrentOutput() {
  if (isNebBatch()) {
    if (!state.neb.batchRows.length) { setStatus("Generate the spreadsheet first.", "error"); return; }
    try {
      if (await downloadSpreadsheet(`${slugify(state.neb.values.title || state.neb.task)}_episode_names.xlsx`, spreadsheetRows(state.neb.batchRows))) setStatus("Episode spreadsheet downloaded.", "success");
    } catch (error) { setStatus(`Download failed. ${error.message}`, "error"); }
    return;
  }
  if (state.domain !== "art") {
    return;
  }
  const text = outputText("filename-output-video");
  if (!text) {
    setStatus("Generate names first.", "error");
    return;
  }
  const titleSlug = slugify(state.art.values.title || "") || "art_names";
  const taskSlug = slugify(state.art.task) || "art";
  const suffix = state.art.outputMode === "set" ? "required_art_names" : "art_filename";
  const filename = `${titleSlug}_${taskSlug}_${suffix}.csv`;
  let rows = currentArtEntries();
  if (activeProfile.id === DEFAULT_PROFILE_ID && state.art.outputMode === "set" && TAGGED_REQUIRED_ART_TASKS.has(state.art.task)) {
    rows = rows.filter((row) => row.tags.length);
  }
  const csvEscape = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const hasTaggedRows = rows.some((row) => row.tags.length);
  const csvRows = hasTaggedRows
    ? [["filename", "tags"], ...rows.map((row) => [row.filename, row.tags.join("; ")])]
    : [["filename"], ...rows.map((row) => [row.filename])];
  const csv = csvRows.map((row) => row.map(csvEscape).join(",")).join("\n");
  try {
    if (await saveText(filename, csv, "text/csv;charset=utf-8")) setStatus("Art name CSV downloaded.", "success");
  } catch (error) { setStatus(`Download failed. ${error.message}`, "error"); }
}

function init() {
  const applyProfile = (profile) => {
    activeProfile = profile;
    for (const domain of ["neb", "art"]) {
      const types = profile.types.filter((type) => type.domain === domain);
      if (!types.some((type) => type.name === state[domain].task)) state[domain].task = types[0].name;
    }
    if (state.domain) { renderBuilder(); resetOutput(); }
  };
  activeProfile = initializeProfiles(applyProfile);
  applyProfile(activeProfile);
  const chooser = document.getElementById("domain-chooser");
  const taskSelect = document.getElementById("task-select");
  const artModeSelect = document.getElementById("art-mode-select");
  const backBtn = document.getElementById("back-btn");
  const generateBtn = document.getElementById("generate-btn");
  const clearBtn = document.getElementById("clear-btn");
  const copyButtons = document.querySelectorAll("[data-copy-target]");
  const downloadBtn = document.getElementById("download-btn");
  const videoOutput = document.getElementById("filename-output-video");

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
  document.getElementById("english-caption-toggle").addEventListener("click", () => {
    state.neb.englishCaptionRevealed = !state.neb.englishCaptionRevealed;
    refreshOutputVisibility();
  });
  copyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      copyFilename(button.dataset.copyTarget, button.dataset.copyLabel || "Name");
    });
  });
  videoOutput.addEventListener("click", (event) => {
    const button = event.target.closest("[data-inline-copy]");
    if (!button) return;
    copyText(button.dataset.inlineCopy || "").then(
      () => setStatus(`${button.dataset.inlineCopyLabel || "Art Filename"} copied.`, "success"),
      () => setStatus("Clipboard access was blocked. Copy the art filename manually.", "warning"),
    );
  });
  downloadBtn.addEventListener("click", downloadCurrentOutput);
  document.getElementById("vertical-output").addEventListener("click", (event) => {
    const button = event.target.closest("[data-inline-copy]");
    if (button) copyText(button.dataset.inlineCopy).then(() => setStatus("Name copied.", "success"), () => setStatus("Clipboard access was blocked.", "error"));
  });
}

if (typeof document !== "undefined") {
  init();
}
