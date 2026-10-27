import { parseArtEpisodes } from './neb_core.mjs?v=2026-10-27-vertical';
import { readEpisodeFile, episodeTemplate } from './spreadsheet_input.mjs?v=2026-10-27-vertical';
import { downloadSpreadsheet } from './spreadsheet_export.mjs?v=2026-10-27-vertical';

export function episodeInputs(values, { multiple = false, houses = {}, needsHouse = true, pathOnly = false } = {}) {
  if (!multiple) return [values];
  const episodes = parseArtEpisodes(values.episodes);
  return episodes.map((episode) => {
    const house = String(houses[episode] || '').trim();
    if (needsHouse && !pathOnly && !house) throw new Error(`Enter the house number for episode ${episode}.`);
    return { ...values, episode, house };
  });
}

const escape = (value) => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function episodeSelectionHtml(state, singleLabel = 'Episode *') {
  const multiple = state.episodeMode === 'multiple';
  const key = multiple ? 'episodes' : 'episode';
  return `<div class="field${multiple&&state.inputMode==='upload'?' full':''}"><label for="episode-mode">Episode Selection</label>
    <select id="episode-mode"><option value="single" ${!multiple?'selected':''}>Single Episode</option><option value="multiple" ${multiple?'selected':''}>Multiple Episodes</option></select>
    ${multiple?`<label for="batch-input-mode">Input Method</label><select id="batch-input-mode"><option value="manual" ${state.inputMode!=='upload'?'selected':''}>Enter Episodes and House Numbers</option><option value="upload" ${state.inputMode==='upload'?'selected':''}>Upload Spreadsheet</option></select>`:''}
    ${multiple&&state.inputMode==='upload'?`<p class="note">Use the template headers, with one episode and house number per row. Excel (.xlsx) and CSV are supported.</p><div class="action-row"><button id="batch-template-btn" type="button" class="action-btn secondary">Download Input Template</button><button id="batch-upload-btn" type="button" class="action-btn secondary">Upload Spreadsheet</button></div><input id="batch-upload-file" type="file" accept=".xlsx,.csv" class="hidden"><p id="batch-upload-note" class="note">${state.uploadRows?.length?`${state.uploadRows.length} episode rows loaded.`:'No spreadsheet uploaded yet.'}</p>`:`<label for="field-${key}">${multiple?'Episodes *':singleLabel}</label>
    <input id="field-${key}" data-field="${key}" value="${escape(state.values[key]||'')}" ${multiple?'placeholder="3,7,8 or 1-89" aria-describedby="episodes-help"':'inputmode="numeric"'}>
    ${multiple?'<small id="episodes-help">Use commas or ranges, for example 3,7,8 or 1-89.</small>':''}`}</div>`;
}

export function houseInputsHtml(state, { needsHouse = true } = {}) {
  if (state.episodeMode !== 'multiple') return '';
  if (state.inputMode === 'upload') return `<label class="batch-caption-choice"><input id="batch-include-english" type="checkbox" ${state.includeEnglish?'checked':''}> Include English captions for Spanish rows</label>`;
  let episodes;
  try { episodes = parseArtEpisodes(state.values.episodes); }
  catch { return '<p class="note">Enter the episodes above to see their house number fields.</p>'; }
  const spanish = state.values.language === 'Spanish';
  return `<p class="note">${episodes.length} episodes selected. ${needsHouse?'Enter the house number for each episode. ':''}Results will be downloaded as an Excel spreadsheet.</p>
    ${needsHouse?`<div class="field-grid">${episodes.map((episode)=>`<div class="field"><label for="house-episode-${episode}">Episode ${episode} House Number *</label><input id="house-episode-${episode}" data-episode-house="${episode}" value="${escape(state.episodeHouses[episode]||'')}" placeholder="${spanish?'LAS':'PUR'}1234567"></div>`).join('')}</div>`:''}
    ${spanish?`<label class="batch-caption-choice"><input id="batch-include-english" type="checkbox" ${state.includeEnglish?'checked':''}> Include English caption names</label>`:''}`;
}

export function outputRows(outputs, fields, { includeEnglish = false, pathFor = null } = {}) {
  const rows = [];
  const add = (filename, kind, language, orientation) => {
    if (!filename) return;
    const folder = pathFor ? pathFor(orientation === 'Vertical') : '';
    rows.push({ filename, episode: String(fields.episode || '').replace(/^e/i,'').padStart(2,'0'),
      house_number: fields.house || '', orientation, output_type: kind, language,
      external_reference: outputs.externalReference || '', ...(folder ? { destination_uri: folder + filename } : {}) });
  };
  const addVariant = (variant, orientation) => {
    add(variant.filename, 'Video', fields.language || 'English', orientation);
    if (fields.language !== 'Spanish' || includeEnglish) add(variant.companionCaptions?.eng, 'Caption', 'English', orientation);
    add(variant.companionCaptions?.las, 'Caption', 'Spanish', orientation);
  };
  addVariant(outputs, outputs.vertical ? 'Horizontal' : 'Standard');
  if (outputs.vertical) addVariant(outputs.vertical, 'Vertical');
  return rows;
}

export function spreadsheetRows(rows) {
  const keys = ['filename','episode','house_number','orientation','output_type','language','external_reference'];
  if (rows.some((row)=>row.destination_uri)) keys.push('destination_uri');
  return [keys, ...rows.map((row)=>keys.map((key)=>row[key] || ''))];
}

export function validateOutputRows(rows) {
  const seen = new Set();
  for (const row of rows) {
    const key = row.destination_uri || row.filename;
    if (seen.has(key)) throw new Error(`Duplicate output: ${row.filename}. Check for repeated episode rows.`);
    seen.add(key);
  }
  return rows;
}

export function bindEpisodeUpload(state, fields, onChange, status) {
  document.getElementById('batch-input-mode')?.addEventListener('change', (event) => {
    state.inputMode = event.target.value; onChange();
  });
  document.getElementById('batch-template-btn')?.addEventListener('click', async () => {
    try { if (await downloadSpreadsheet('episode_input_template.xlsx', episodeTemplate(fields, state.values))) status('Input template downloaded.', 'success'); }
    catch(error) { status(error.message, 'error'); }
  });
  document.getElementById('batch-upload-btn')?.addEventListener('click', () => document.getElementById('batch-upload-file').click());
  document.getElementById('batch-upload-file')?.addEventListener('change', async (event) => {
    const file = event.target.files[0]; if (!file) return;
    try {
      state.uploadRows = await readEpisodeFile(file, fields.map((field)=>typeof field==='string'?field:field.key));
      onChange(); status(`${state.uploadRows.length} episode rows uploaded. Generate the spreadsheet to create their names.`, 'success');
    } catch(error) { state.uploadRows=[]; onChange(); status(error.message, 'error'); }
  });
}

export function batchEpisodeInputs(state, options = {}) {
  if (state.inputMode === 'upload') {
    if (!state.uploadRows?.length) throw new Error('Upload a completed input spreadsheet first.');
    return state.uploadRows;
  }
  return episodeInputs(state.values, { multiple: true, houses: state.episodeHouses, ...options });
}

export function verticalOutputsHtml(vertical, { language = 'English', showEnglish = false } = {}) {
  if (!vertical) return '';
  const items = [['Vertical MOV Name',vertical.filename]];
  if(language!=='Spanish'||showEnglish)items.push(['Vertical English Caption',vertical.companionCaptions?.eng]);
  items.push(['Vertical Spanish Caption',vertical.companionCaptions?.las]);
  return items.filter(([,value])=>value).map(([label,value])=>`<div class="output-item"><div class="output-head"><strong>${label}</strong><button type="button" class="copy-icon-btn" data-inline-copy="${escape(value)}" aria-label="Copy ${label}" title="Copy ${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1Zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H10V7h9v14Z"/></svg></button></div><div class="filename">${escape(value)}</div></div>`).join('');
}
