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
} from "./neb_core.mjs?v=2026-07-10-spanish-sub";
import {
  FIELD_SKU,
  PATHMAKER_DEFAULTS,
  PATHMAKER_EXTRA_USAGE_TO_PREFIX,
  PATHMAKER_SERIES_TASK,
  PATHMAKER_TASKS,
  buildPathmakerPath,
  pathmakerFieldsForTask,
} from "./neb_pathmaker_core.mjs?v=2026-08-06-pathmaker-series-v1";

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
  "Episode Caption": { title: "Series Title *" },
  "Virtual Screening Episode": { title: "Series Title *" },
  "Virtual Screening Episode Caption": { title: "Series Title *" },
};

const state = {
  task: "Movie",
  values: { ...PATHMAKER_DEFAULTS },
  subtitleManual: false,
};

function taskOptions() {
  return Object.keys(PATHMAKER_TASKS).filter((task) => !NEB_SINGLE_HIDDEN_TASKS.has(task));
}

function optionsForField(field) {
  if (field === "language") return LANGUAGE_OPTIONS;
  if (field === "subtitle_type") return state.values.language === "Spanish" ? ["sub"] : SUBTITLE_TYPE_OPTIONS;
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
  fieldsEl.innerHTML = fields.map((field) => {
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
  refreshOutputVisibility();
}

function refreshOutputVisibility() {
  const isPathOnly = currentTaskIsPathOnly();
  const hasCompanionCaptions = !isPathOnly && Boolean(COMPANION_CAPTION_TASKS[state.task]);
  document.getElementById("generate-btn").classList.toggle("hidden", isPathOnly);
  document.getElementById("output-video-wrap").classList.toggle("hidden", isPathOnly);
  document.getElementById("output-caption-eng-wrap").classList.toggle("hidden", !hasCompanionCaptions);
  document.getElementById("output-caption-las-wrap").classList.toggle("hidden", !hasCompanionCaptions);
  document.getElementById("output-external-reference-wrap").classList.toggle("hidden", isPathOnly);
}

function onFieldInput(event) {
  const field = event.target.dataset.field;
  state.values[field] = event.target.value;

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
    const outputs = buildNebOutputs(state.task, state.values);
    document.getElementById("filename-output-video").textContent = outputs.filename;
    document.getElementById("filename-output-caption-eng").textContent = outputs.companionCaptions?.eng || "";
    document.getElementById("filename-output-caption-las").textContent = outputs.companionCaptions?.las || "";
    document.getElementById("filename-output-external-reference").textContent = outputs.externalReference;
    if (plusWarningNeeded(state.values)) {
      setStatus(`Name generated. ${PLUS_WARNING_MESSAGE}`, "warning");
    } else {
      setStatus("Name generated.", "success");
    }
  } catch (error) {
    document.getElementById("filename-output-video").textContent = "";
    document.getElementById("filename-output-caption-eng").textContent = "";
    document.getElementById("filename-output-caption-las").textContent = "";
    document.getElementById("filename-output-external-reference").textContent = "";
    setStatus(error.message || "Unable to generate name.", "error");
  }
}

function generatePath() {
  try {
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
    await navigator.clipboard.writeText(text);
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
  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", () => copyValue(button.dataset.copyTarget, button.dataset.copyLabel || "Output"));
  });
  renderFields();
}

if (typeof document !== "undefined") {
  init();
}
