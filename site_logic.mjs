import {
  ART_DEFAULTS,
  ART_OUTPUT_MODES,
  ART_TASKS,
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
  buildNebExternalReference,
  buildNebFilename,
  buildNebOutputs,
  buildRequiredArtFilenames,
  normalizeArtTag,
  plusWarningNeeded,
  requiredArtEntries,
  requiredArtFields,
  slugify,
} from "./neb_core.mjs?v=2026-09-01-axinom-art-types";

export {
  buildArtFilename,
  buildNebExternalReference,
  buildNebFilename,
  buildNebOutputs,
  buildRequiredArtFilenames,
  requiredArtEntries,
} from "./neb_core.mjs?v=2026-09-01-axinom-art-types";

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
    "Podcast Episodes": { title: "Series Title *" },
    "Familia Mini-Novelas Episodes": { title: "Series Title *" },
  },
};

const state = {
  domain: null,
  neb: { task: "Movie", values: { ...NEB_DEFAULTS }, subtitleManual: false },
  art: { task: "Movie", values: { ...ART_DEFAULTS }, outputMode: "set" },
};

function optionsForField(domain, field, task, values) {
  if (field === "language") return LANGUAGE_OPTIONS;
  if (field === "subtitle_type") return domain === "neb" && values.language === "Spanish" ? ["sub"] : SUBTITLE_TYPE_OPTIONS;
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

function renderVideoOutput(value) {
  const output = document.getElementById("filename-output-video");
  if (state.domain === "art" && getDomainState().outputMode === "set") {
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
  const hasCompanionCaptions = state.domain === "neb" && Boolean(COMPANION_CAPTION_TASKS[getDomainState().task]);
  const outputLabel = document.getElementById("output-video-label");
  const outputNote = document.getElementById("output-note");
  const downloadBtn = document.getElementById("download-btn");
  const generateBtn = document.getElementById("generate-btn");
  const copyVideoBtn = document.getElementById("copy-video-btn");
  document.getElementById("output-video-wrap").classList.remove("hidden");
  if (state.domain === "neb") {
    outputLabel.textContent = "MOV Name";
    copyVideoBtn.dataset.copyLabel = "MOV Name";
    copyVideoBtn.setAttribute("aria-label", "Copy MOV Name");
    copyVideoBtn.setAttribute("title", "Copy MOV Name");
    outputNote.textContent = "For supported video tasks, the tool shows the MOV name, both caption names, and the external reference together.";
    downloadBtn.classList.add("hidden");
    generateBtn.textContent = "Generate Name";
    document.getElementById("output-caption-eng-wrap").classList.toggle("hidden", !hasCompanionCaptions);
    document.getElementById("output-caption-las-wrap").classList.toggle("hidden", !hasCompanionCaptions);
    document.getElementById("output-external-reference-wrap").classList.remove("hidden");
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
    generateBtn.textContent = getDomainState().outputMode === "set" ? "Generate Names" : "Generate Name";
    document.getElementById("output-caption-eng-wrap").classList.add("hidden");
    document.getElementById("output-caption-las-wrap").classList.add("hidden");
    document.getElementById("output-external-reference-wrap").classList.add("hidden");
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

function generateCurrentFilename() {
  const domainState = getDomainState();
  try {
    let filename;
    let companionCaptions = null;
    let externalReference = "";
    if (state.domain === "neb") {
      const outputs = buildNebOutputs(domainState.task, domainState.values);
      filename = outputs.filename;
      companionCaptions = outputs.companionCaptions;
      externalReference = outputs.externalReference;
    } else {
      filename = domainState.outputMode === "set"
        ? buildRequiredArtFilenames(domainState.task, domainState.values).join("\n")
        : buildArtFilename(domainState.task, domainState.values);
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
    await navigator.clipboard.writeText(text);
    setStatus(`${label} copied.`, "success");
  } catch {
    setStatus(`Clipboard access was blocked. Copy the ${label.toLowerCase()} manually.`, "warning");
  }
}

function downloadCurrentOutput() {
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
  let rows = state.art.outputMode === "set"
    ? requiredArtEntries(state.art.task, state.art.values)
    : [{ filename: text, tags: [] }];
  if (state.art.outputMode === "set" && TAGGED_REQUIRED_ART_TASKS.has(state.art.task)) {
    rows = rows.filter((row) => row.tags.length);
  }
  const csvEscape = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const hasTaggedRows = rows.some((row) => row.tags.length);
  const csvRows = hasTaggedRows
    ? [["filename", "tags"], ...rows.map((row) => [row.filename, row.tags.join("; ")])]
    : [["filename"], ...rows.map((row) => [row.filename])];
  const csv = csvRows.map((row) => row.map(csvEscape).join(",")).join("\n");
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
  copyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      copyFilename(button.dataset.copyTarget, button.dataset.copyLabel || "Name");
    });
  });
  videoOutput.addEventListener("click", (event) => {
    const button = event.target.closest("[data-inline-copy]");
    if (!button) return;
    navigator.clipboard.writeText(button.dataset.inlineCopy || "").then(
      () => setStatus(`${button.dataset.inlineCopyLabel || "Art Filename"} copied.`, "success"),
      () => setStatus("Clipboard access was blocked. Copy the art filename manually.", "warning"),
    );
  });
  downloadBtn.addEventListener("click", downloadCurrentOutput);
}

if (typeof document !== "undefined") {
  init();
}
