import { copyText } from "./desktop_bridge.mjs";
import { batchEpisodeInputs, bindEpisodeUpload, episodeSelectionHtml, houseInputsHtml, outputRows, spreadsheetRows, verticalOutputsHtml, validateOutputRows } from "./episode_workflow.mjs?v=2026-10-27-vertical";
import { downloadSpreadsheet } from "./spreadsheet_export.mjs?v=2026-10-27-vertical";
import {
  COMPANION_CAPTION_TASKS,
  EXTRA_USAGE_OPTIONS,
  LANGUAGE_OPTIONS,
  NEB_SINGLE_HIDDEN_TASKS,
  PLUS_WARNING_MESSAGE,
  RESOLUTION_OPTIONS,
  SUBTITLE_DEFAULT_BY_LANGUAGE,
  SUBTITLE_TYPE_OPTIONS,
  buildNebOutputs,
  plusWarningNeeded,
} from "./neb_core.mjs?v=2026-10-27-vertical";
import {
  FIELD_SKU,
  PATHMAKER_DEFAULTS,
  PATHMAKER_EXTRA_USAGE_TO_PREFIX,
  PATHMAKER_SERIES_TASK,
  PATHMAKER_TASKS,
  buildPathmakerPath,
  pathmakerFieldsForTask,
} from "./neb_pathmaker_core.mjs?v=2026-10-27-vertical";

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
  [FIELD_SKU]: { label: "SKU / Parent SKU *", type: "text", full: true },
};

const TASK_FIELD_LABEL_OVERRIDES = {
  [PATHMAKER_SERIES_TASK]: { title: "Series Title *" },
  "Episode": { title: "Series Title *" },
  "Vertical Episodes": { title: "Series Title *" },
  "Episode Caption": { title: "Series Title *" },
  "Virtual Screening Episode": { title: "Series Title *" },
  "Virtual Screening Episode Caption": { title: "Series Title *" },
};

const state = {
  task: "Movie",
  values: { ...PATHMAKER_DEFAULTS },
  subtitleManual: false,
  episodeMode: "single", episodeHouses: {}, includeEnglish: false, batchRows: [], singleOutput: null,
  inputMode: "manual", uploadRows: [], showEnglish: false,
};

function taskOptions() {
  return Object.keys(PATHMAKER_TASKS).filter((task) => !NEB_SINGLE_HIDDEN_TASKS.has(task));
}

function optionsForField(field) {
  if (field === "language") return LANGUAGE_OPTIONS;
  if (field === "subtitle_type") return state.values.language === "Spanish" ? ["cc"] : SUBTITLE_TYPE_OPTIONS;
  if (field === "resolution") return RESOLUTION_OPTIONS;
  if (field === "extra_usage") return EXTRA_USAGE_OPTIONS.filter((option) => PATHMAKER_EXTRA_USAGE_TO_PREFIX[option]);
  return [];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setStatus(message, tone) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `status ${tone}`;
}

function outputText(targetId) {
  const output = document.getElementById(targetId);
  return output?.textContent.trim() || "";
}

function clearOutputs() {
  [
    "filename-output-video",
    "filename-output-caption-eng",
    "filename-output-caption-las",
    "filename-output-external-reference",
    "path-output",
  ].forEach((id) => {
    document.getElementById(id).textContent = "";
  });
  setStatus("", "hidden");
  state.batchRows = []; state.singleOutput = null; state.showEnglish = false;
  document.getElementById("vertical-output").textContent = "";
  document.getElementById("episode-batch-output").textContent = "Generate an Excel spreadsheet for the selected episodes.";
  refreshOutputVisibility();
}

function bindFieldHandlers(fields) {
  fields.forEach((field) => {
    const el = document.getElementById(`field-${field}`);
    if (!el) return;
    el.value = state.values[field] ?? "";
    el.addEventListener("input", onFieldInput);
    el.addEventListener("change", onFieldInput);
  });
}

function currentTaskIsPathOnly() {
  return Boolean(PATHMAKER_TASKS[state.task]?.pathOnly);
}

function renderFields() {
  const fieldsEl = document.getElementById("fields");
  const fields = pathmakerFieldsForTask(state.task);
  const overrides = TASK_FIELD_LABEL_OVERRIDES[state.task] || {};
  fieldsEl.innerHTML = fields.filter((field) => !isBatch() || (state.inputMode === "upload" ? field === "episode" : field !== "house")).map((field) => {
    if (field === "episode") return episodeSelectionHtml(state);
    const config = FIELD_CONFIG[field];
    const label = overrides[field] || config.label;
    const full = config.full ? " full" : "";
    const value = state.values[field] ?? "";
    if (config.type === "select") {
      return `
        <div class="field${full}">
          <label for="field-${field}">${escapeHtml(label)}</label>
          <select id="field-${field}" data-field="${field}">
            ${optionsForField(field).map((option) => `
              <option value="${escapeHtml(option)}"${option === value ? " selected" : ""}>${escapeHtml(option)}</option>
            `).join("")}
          </select>
        </div>
      `;
    }
    return `
      <div class="field${full}">
        <label for="field-${field}">${escapeHtml(label)}</label>
        <input id="field-${field}" data-field="${field}" type="text" value="${escapeHtml(value)}">
      </div>
    `;
  }).join("");
  bindFieldHandlers(fields);
  document.getElementById("episode-mode")?.addEventListener("change", (event) => {
    state.episodeMode = event.target.value; renderFields(); clearOutputs();
  });
  document.getElementById("field-episodes")?.addEventListener("input", onFieldInput);
  if (isBatch()) {
    fieldsEl.insertAdjacentHTML("beforeend", '<div id="batch-houses" class="field full"></div>');
    renderBatchHouses();
  }
  bindEpisodeUpload(state, fields, () => { renderFields(); clearOutputs(); }, setStatus);
  refreshOutputVisibility();
}

function isBatch() {
  return state.episodeMode === "multiple" && pathmakerFieldsForTask(state.task).includes("episode");
}

function renderBatchHouses() {
  const container = document.getElementById("batch-houses");
  if (!container || !isBatch()) return;
  container.innerHTML = houseInputsHtml(state);
  container.querySelector('.field-grid')?.classList.add('batch-house-fields');
  container.querySelectorAll("[data-episode-house]").forEach((input) => input.addEventListener("input", () => {
    state.episodeHouses[input.dataset.episodeHouse] = input.value; clearOutputs();
  }));
  container.querySelector("#batch-include-english")?.addEventListener("change", (event) => {
    state.includeEnglish = event.target.checked; clearOutputs();
  });
}

function refreshOutputVisibility() {
  const isPathOnly = currentTaskIsPathOnly();
  const hasCompanionCaptions = !isPathOnly && Boolean(COMPANION_CAPTION_TASKS[state.task]);
  document.getElementById("generate-btn").classList.toggle("hidden", isPathOnly);
  document.getElementById("output-video-wrap").classList.toggle("hidden", isPathOnly);
  const revealEnglish = state.values.language !== "Spanish" || state.showEnglish;
  document.getElementById("output-caption-eng-wrap").classList.toggle("hidden", !hasCompanionCaptions || !revealEnglish);
  document.getElementById("output-caption-las-wrap").classList.toggle("hidden", !hasCompanionCaptions);
  document.getElementById("output-external-reference-wrap").classList.toggle("hidden", isPathOnly);
  document.getElementById("single-output-stack").classList.toggle("hidden", isBatch());
  document.getElementById("episode-batch-output").classList.toggle("hidden", !isBatch());
  document.getElementById("batch-download-btn").classList.toggle("hidden", !isBatch());
  document.getElementById("pathmaker-btn").classList.toggle("hidden", isBatch());
  document.getElementById("generate-btn").textContent = isBatch() ? "Generate Spreadsheet" : "Generate Name";
  const toggle = document.getElementById("pathmaker-english-toggle");
  toggle.classList.toggle("hidden", !hasCompanionCaptions || state.values.language !== "Spanish");
  toggle.textContent = state.showEnglish ? "Hide English Caption" : "Show English Caption";
  toggle.setAttribute("aria-expanded", String(state.showEnglish));
  document.getElementById("vertical-output").innerHTML = verticalOutputsHtml(state.singleOutput?.vertical, { language: state.values.language, showEnglish: revealEnglish });
}

function onFieldInput(event) {
  const field = event.target.dataset.field;
  state.values[field] = event.target.value;
  if (field === "episodes") renderBatchHouses();

  if (field === "subtitle_type") {
    state.subtitleManual = true;
  }

  if (field === "language") {
    if (event.target.value === "Spanish" || !state.subtitleManual) {
      state.values.subtitle_type = SUBTITLE_DEFAULT_BY_LANGUAGE[event.target.value] || "cc";
      state.subtitleManual = false;
    }
    renderFields();
  }

  clearOutputs();
}

function onTaskChange(event) {
  state.task = event.target.value;
  state.subtitleManual = false;
  state.values.language = PATHMAKER_TASKS[state.task].defaultLanguage || state.values.language || "English";
  state.episodeHouses = {}; state.uploadRows = [];
  const language = state.values.language || "English";
  state.values.subtitle_type = SUBTITLE_DEFAULT_BY_LANGUAGE[language] || "cc";
  renderFields();
  clearOutputs();
}

function generateName() {
  if (currentTaskIsPathOnly()) {
    generatePath();
    return;
  }
  try {
    if (isBatch()) {
      const inputs = batchEpisodeInputs(state);
      const rows = inputs.flatMap((fields) => outputRows(buildNebOutputs(state.task, fields), fields, {
        includeEnglish: state.includeEnglish, pathFor: (vertical) => buildPathmakerPath(state.task, fields, { vertical }),
      }));
      state.batchRows = validateOutputRows(rows);
      document.getElementById("episode-batch-output").textContent = `${inputs.length} episodes / ${rows.length} files with S3 destinations ready. Download the spreadsheet.`;
      setStatus(inputs.some(plusWarningNeeded) ? `Episode spreadsheet is ready. ${PLUS_WARNING_MESSAGE}` : "Episode spreadsheet is ready.", inputs.some(plusWarningNeeded) ? "warning" : "success");
      return;
    }
    const outputs = buildNebOutputs(state.task, state.values);
    state.singleOutput = outputs;
    document.getElementById("filename-output-video").textContent = outputs.filename;
    document.getElementById("filename-output-caption-eng").textContent = outputs.companionCaptions?.eng || "";
    document.getElementById("filename-output-caption-las").textContent = outputs.companionCaptions?.las || "";
    document.getElementById("filename-output-external-reference").textContent = outputs.externalReference;
    refreshOutputVisibility();
    if (state.task === "Vertical Episodes" && state.values.sku) {
      document.getElementById("path-output").textContent = outputRows(outputs, state.values, {
        pathFor: (vertical) => buildPathmakerPath(state.task, state.values, { vertical }), includeEnglish: state.showEnglish,
      }).map((row) => row.destination_uri).join("\n");
    }
    if (plusWarningNeeded(state.values)) {
      setStatus(`Name generated. ${PLUS_WARNING_MESSAGE}`, "warning");
    } else {
      setStatus("Name generated.", "success");
    }
  } catch (error) {
    clearOutputs();
    document.getElementById("filename-output-video").textContent = "";
    document.getElementById("filename-output-caption-eng").textContent = "";
    document.getElementById("filename-output-caption-las").textContent = "";
    document.getElementById("filename-output-external-reference").textContent = "";
    setStatus(error.message || "Unable to generate name.", "error");
  }
}

function generatePath() {
  if (isBatch()) { generateName(); return; }
  try {
    if (state.task === "Vertical Episodes") {
      if (state.values.house) { generateName(); return; }
      document.getElementById("path-output").textContent = [buildPathmakerPath(state.task, state.values), buildPathmakerPath(state.task, state.values, { vertical: true })].join("\n");
      setStatus("Horizontal and vertical folders generated.", "success");
      return;
    }
    const path = buildPathmakerPath(state.task, state.values);
    document.getElementById("path-output").textContent = path;
    setStatus("Path generated.", "success");
  } catch (error) {
    document.getElementById("path-output").textContent = "";
    setStatus(error.message || "Unable to generate path.", "error");
  }
}

function clearForm() {
  state.values = { ...PATHMAKER_DEFAULTS };
  state.values.language = PATHMAKER_TASKS[state.task].defaultLanguage || PATHMAKER_DEFAULTS.language;
  state.episodeHouses = {}; state.uploadRows = [];
  state.subtitleManual = false;
  renderFields();
  clearOutputs();
}

async function copyValue(targetId, label) {
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

function init() {
  const taskSelect = document.getElementById("task-select");
  taskSelect.innerHTML = taskOptions().map((task) => `<option value="${escapeHtml(task)}">${escapeHtml(task)}</option>`).join("");
  taskSelect.value = state.task;
  taskSelect.addEventListener("change", onTaskChange);
  document.getElementById("generate-btn").addEventListener("click", generateName);
  document.getElementById("pathmaker-btn").addEventListener("click", generatePath);
  document.getElementById("clear-btn").addEventListener("click", clearForm);
  document.getElementById("pathmaker-english-toggle").addEventListener("click", () => {
    state.showEnglish = !state.showEnglish; refreshOutputVisibility();
  });
  document.getElementById("vertical-output").addEventListener("click", (event) => {
    const button = event.target.closest("[data-inline-copy]");
    if (button) copyText(button.dataset.inlineCopy).then(() => setStatus("Name copied.", "success"), () => setStatus("Clipboard access was blocked.", "error"));
  });
  document.getElementById("batch-download-btn").addEventListener("click", async () => {
    if (!state.batchRows.length) { setStatus("Generate the spreadsheet first.", "error"); return; }
    try {
      if (await downloadSpreadsheet("episode_names_and_paths.xlsx", spreadsheetRows(state.batchRows))) setStatus("Episode spreadsheet downloaded.", "success");
    } catch (error) { setStatus(error.message, "error"); }
  });
  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", () => copyValue(button.dataset.copyTarget, button.dataset.copyLabel || "Output"));
  });
  renderFields();
}

if (typeof document !== "undefined") {
  init();
}
