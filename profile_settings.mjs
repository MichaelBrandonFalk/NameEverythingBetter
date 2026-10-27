import { defaultProfile, editableCopy, validateProfile, FIELD_DEFINITIONS, profileNebOutputs, profileArtEntries } from './naming_profiles.mjs?v=2026-10-27-vertical';
import { isDesktop, readProfile, saveText } from './desktop_bridge.mjs?v=2026-10-27-vertical';
import { exportProfileRulesText } from './profile_rules_text.mjs?v=2026-10-27-profile-rules';

const STORE = 'neb.naming-profiles.v1';
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const element = (id) => document.getElementById(id);
const PREFIX_RULES = ['englishMedia', 'spanishMedia', 'englishArt', 'spanishArt', 'spanishMarker', 'englishCaption', 'spanishCaption', 'ampersand', 'at'];
const RULE_LABELS = ['English video/caption code', 'Spanish video/caption code', 'English art code', 'Spanish art code', 'Spanish in-name marker', 'English caption type', 'Spanish caption type', '& becomes', '@ becomes'];

export function initializeProfiles(onChange) {
  const standard = defaultProfile();
  let profiles = [];
  let selected = standard.id;
  let storageMessage = '';
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved) {
      for (const item of saved.profiles || []) {
        try { profiles.push(validateProfile(item)); } catch { storageMessage = 'Some saved profiles could not be loaded. Your standard conventions are available.'; }
      }
      if (profiles.some((profile) => profile.id === saved.selected)) selected = saved.selected;
    }
  } catch { storageMessage = 'Profile storage is unavailable. You can still export profiles to keep a copy.'; }
  let draft = null;
  let typeIndex = 0;
  let language = 'English';
  const active = () => profiles.find((profile) => profile.id === selected) || standard;
  function uniqueName(name) {
    let resolved = name; let number = 2;
    while ([standard, ...profiles].some((profile) => profile.name === resolved)) resolved = `${name} ${number++}`;
    return resolved;
  }
  const status = (message, error = false) => {
    const node = element('profile-status');
    node.textContent = message;
    node.className = `profile-status ${error ? 'error' : ''}`;
  };
  function persist(nextProfiles, nextSelected) {
    // Write before replacing in-memory state so a failed save cannot masquerade as success.
    localStorage.setItem(STORE, JSON.stringify({ profiles: nextProfiles, selected: nextSelected }));
    profiles = nextProfiles;
    selected = nextSelected;
  }
  function renderSelector() {
    element('profile-select').innerHTML = [standard, ...profiles].map((profile) => `<option value="${escape(profile.id)}">${escape(profile.name)}</option>`).join('');
    element('profile-select').value = selected;
    element('profile-delete').disabled = selected === standard.id;
  }
  const ruleInput = (key, label) => `<div class="field"><label for="rule-${key}">${label}</label><input id="rule-${key}" value="${escape(draft.rules[key])}"></div>`;
  const ruleSelect = (key, label, choices) => `<div class="field"><label for="rule-${key}">${label}</label><select id="rule-${key}">${choices.map(([value, text]) => `<option value="${value}" ${draft.rules[key] === value ? 'selected' : ''}>${text}</option>`).join('')}</select></div>`;
  function renderEditor() {
    const editor = element('profile-editor');
    if (!draft) {
      editor.innerHTML = '<p class="note">NEB Standard is protected. Choose Make Editable Copy to create your own conventions.</p>';
      return;
    }
    editor.innerHTML = `
      <div class="field"><label for="profile-name">Profile Name</label><input id="profile-name" maxlength="100" value="${escape(draft.name)}"></div>
      <details class="profile-subsection" open><summary>Title and Language Rules</summary><div class="field-grid">
      ${ruleSelect('titleCase', 'Title Letter Case', [['lower','lowercase'],['preserve','Keep typed letter case'],['upper','UPPERCASE']])}
      ${ruleSelect('separator', 'Word Separator', [['_','Underscore (_)'],['-','Hyphen (-)']])}
      ${ruleSelect('apostrophes', 'Apostrophes', [['remove','Remove: Bob\'s becomes Bobs'],['space','Use a word separator']])}
      ${ruleSelect('plus', '+ Symbol', [['context','Context: Romeo + Juliet / GFAM+'],['and','Always and'],['plus','Always plus']])}
      <div class="field"><label for="rule-stripAccents">Accents</label><select id="rule-stripAccents"><option value="true" ${draft.rules.stripAccents ? 'selected' : ''}>Strip accents</option><option value="false" ${!draft.rules.stripAccents ? 'selected' : ''}>Keep accents</option></select></div>
      ${PREFIX_RULES.map((key,index)=>ruleInput(key,RULE_LABELS[index])).join('')}
      <div class="field"><label for="rule-houseDigits">House Number Digits</label><input id="rule-houseDigits" type="number" min="1" max="20" value="${draft.rules.houseDigits}"></div>
      <div class="field"><label for="rule-spanishPrefixes">Spanish House Prefixes</label><input id="rule-spanishPrefixes" value="${escape(draft.rules.spanishPrefixes.join(', '))}"></div>
      </div></details>
      <details class="profile-subsection" open><summary>Types and Filename Recipes</summary>
      <p class="note">Select a type to edit. Recipes use braces, such as {title}_{language}.{extension}. Each listed field is required. Save Profile applies your changes.</p>
      <div class="action-row"><button id="profile-add-neb" type="button" class="action-btn secondary">Add Video Type</button><button id="profile-add-art" type="button" class="action-btn secondary">Add Art Type</button></div>
      <div class="field"><label for="profile-type">Type To Edit</label><select id="profile-type">${draft.types.map((type,index)=>`<option value="${index}" ${index===typeIndex?'selected':''}>${type.domain==='art'?'Art':'Video'} / ${escape(type.name)}</option>`).join('')}</select></div>
      <div id="profile-type-editor"></div></details>
      <details class="profile-subsection"><summary>Recipe Guide</summary><p class="note">{title} and custom text fields use your title rules. {season} becomes s02, {episode} becomes e05, and {year} stays 2026. {house} keeps capital letters. {language} uses the selected language code; caption outputs use their own language. {extra} is bts, del, int, alt, mus or clp. Art recipes use {art_tag}, {aspect_ratio}, {dimensions} and {extension}. Title Treatment uses png; other art uses jpg. Video recipes specify their extension directly. {external_reference} uses the existing shortened reference rule.</p>
      <p class="note">Add fields one per line: key | Label | text. For a dropdown: key | Label | select | choice1, choice2. Standard keys: ${Object.keys(FIELD_DEFINITIONS).join(', ')}. Custom keys can contain lowercase letters, numbers and underscores.</p></details>
      <div class="action-row"><button id="profile-save" class="action-btn primary" type="button">Save Profile</button><button id="profile-preview" class="action-btn secondary" type="button">Preview Example</button></div>
      <pre id="profile-preview-output" class="profile-preview hidden" aria-live="polite"></pre>`;
    renderTypeEditor();
    element('profile-type').addEventListener('change', (event) => {
      try { captureType(); typeIndex = Number(event.target.value); renderTypeEditor(); }
      catch (error) { event.target.value = typeIndex; status(error.message, true); }
    });
    for (const domain of ['neb','art']) element(`profile-add-${domain}`).addEventListener('click', () => {
      try {
        captureDraft();
        const source = draft.types.find((type)=>type.domain===domain) || standard.types.find((type)=>type.domain===domain);
        const added = structuredClone(source);
        const base = domain === 'neb' ? 'New Video Type' : 'New Art Type';
        let name = base; let number = 2;
        while(draft.types.some((type)=>type.domain===domain&&type.name===name)) name = `${base} ${number++}`;
        added.name = name;
        draft.types.push(added); typeIndex = draft.types.length-1;
        renderEditor(); status('New type added to your draft. Edit its fields and recipes, then Save Profile.');
      } catch(error) { status(error.message,true); }
    });
    element('profile-save').addEventListener('click', () => {
      try {
        captureDraft(); validateProfile(draft);
        if (profiles.some((profile) => profile.id !== draft.id && profile.name === draft.name)) throw new Error('Give this profile a different name from the other saved profiles.');
        const saved = structuredClone(draft);
        persist([...profiles.filter((profile)=>profile.id!==saved.id),saved],saved.id);
        renderSelector(); onChange(active()); status('Profile saved and selected.');
      } catch(error) { status(`Profile was not saved. ${error.message}`,true); }
    });
    element('profile-preview').addEventListener('click', () => {
      try {
        captureDraft(); validateProfile(draft);
        const type = draft.types[typeIndex];
        const values = { title: "Bob's Movie", language, resolution:'hd', house:`${language==='Spanish'?draft.rules.spanishPrefixes[0]:type.englishPrefixes[0]}${'1'.repeat(draft.rules.houseDigits)}`, season:'02', episode:'05', year:'2026', interviewees:'Example Guest' };
        for (const field of type.fields) if (!values[field.key]) values[field.key] = field.type==='select' ? field.options[0] : 'Example';
        let output;
        if(type.domain==='art') output=profileArtEntries(draft,type.name,values).map((entry)=>entry.filename).join('\n');
        else { const result=profileNebOutputs(draft,type.name,values); output=[result.filename,result.companionCaptions?.eng,result.companionCaptions?.las,result.externalReference].filter(Boolean).join('\n'); }
        element('profile-preview-output').textContent=output;
        element('profile-preview-output').classList.remove('hidden'); status('Preview uses example values. Your profile has not been saved by previewing.');
      } catch(error) { status(error.message,true); }
    });
  }
  function renderTypeEditor() {
    const type = draft.types[typeIndex];
    const recipes = type.templates[language];
    const textField = (id,label,value) => `<div class="field"><label for="${id}">${label}</label><input id="${id}" value="${escape(value)}"></div>`;
    element('profile-type-editor').innerHTML = `
      ${textField('profile-type-name','Type Name',type.name)}
      <div class="field"><label for="profile-fields">Required Fields</label><textarea id="profile-fields" rows="6">${escape(type.fields.map((field)=>`${field.key} | ${field.label} | ${field.type}${field.type==='select'?` | ${field.options.join(', ')}`:''}`).join('\n'))}</textarea></div>
      ${type.domain==='neb'?textField('profile-english-prefixes','English House Prefixes (comma separated)',type.englishPrefixes.join(', ')):''}
      <div class="field"><label for="profile-recipe-language">Recipe Language</label><select id="profile-recipe-language"><option ${language==='English'?'selected':''}>English</option><option ${language==='Spanish'?'selected':''}>Spanish</option></select></div>
      ${textField('recipe-filename',type.domain==='art'?'Art Filename Recipe':'Video Filename Recipe',recipes.filename)}
      ${type.domain==='neb'?textField('recipe-eng','English Caption Recipe (blank to omit)',recipes.eng)+textField('recipe-las','Spanish Caption Recipe (blank to omit)',recipes.las)+textField('recipe-reference','External Reference Recipe (blank to omit)',recipes.reference):''}
      ${recipes.verticalFilename!==undefined?textField('recipe-verticalFilename','Vertical Video Recipe',recipes.verticalFilename)+textField('recipe-verticalEng','Vertical English Caption Recipe',recipes.verticalEng||'')+textField('recipe-verticalLas','Vertical Spanish Caption Recipe',recipes.verticalLas||''):''}
      ${type.domain==='art'?`<div class="field"><label for="profile-sizes">Allowed Art Sizes</label><p class="note">One per line: tag | aspect ratio | dimensions</p><textarea id="profile-sizes" rows="7">${escape(type.sizes.map((row)=>`${row.artTag} | ${row.aspectRatio} | ${row.dimensions}`).join('\n'))}</textarea></div><div class="field"><label for="profile-variants">Required Art Variants</label><p class="note">One per line: tag | aspect ratio | dimensions | tags (optional). Tags are comma separated.</p><textarea id="profile-variants" rows="7">${escape(type.variants.map((row)=>`${row.artTag} | ${row.aspectRatio} | ${row.dimensions} | ${(row.tags||[]).join(', ')}`).join('\n'))}</textarea></div>`:''}
      <div class="action-row"><button id="profile-remove-type" type="button" class="action-btn secondary">Remove This Type</button></div>`;
    element('profile-recipe-language').addEventListener('change', (event) => {
      try { captureType(); language=event.target.value; renderTypeEditor(); }
      catch(error) { event.target.value=language; status(error.message,true); }
    });
    element('profile-remove-type').addEventListener('click', () => {
      captureRules(); draft.types.splice(typeIndex,1); typeIndex=0;
      if (!draft.types.length) draft.types.push(structuredClone(standard.types[0]));
      renderEditor(); status('Type removed from the draft. Save Profile to apply.');
    });
  }
  function captureRules() {
    draft.name=element('profile-name').value.trim();
    for(const key of [...PREFIX_RULES,'titleCase','separator','apostrophes','plus']) draft.rules[key]=element(`rule-${key}`).value;
    draft.rules.stripAccents=element('rule-stripAccents').value==='true';
    draft.rules.houseDigits=Number(element('rule-houseDigits').value);
    draft.rules.spanishPrefixes=element('rule-spanishPrefixes').value.split(',').map((value)=>value.trim().toUpperCase()).filter(Boolean);
  }
  function captureType() {
    const type=draft.types[typeIndex];
    const fields=element('profile-fields').value.split('\n').filter((line)=>line.trim()).map((line)=>{
      const [key,label,kind,choices='']=line.split('|').map((value)=>value.trim());
      const definition={key,label,type:kind};
      if(kind==='select') definition.options=choices.split(',').map((value)=>value.trim()).filter(Boolean);
      return definition;
    });
    const parseSizes=(id,tags)=>element(id).value.split('\n').filter((line)=>line.trim()).map((line)=>{
      const [artTag,aspectRatio,dimensions,tagList='']=line.split('|').map((value)=>value.trim());
      return {artTag,aspectRatio,dimensions,...(tags?{tags:tagList.split(',').map((value)=>value.trim()).filter(Boolean)}:{})};
    });
    type.name=element('profile-type-name').value.trim(); type.fields=fields;
    type.templates[language]={...type.templates[language],filename:element('recipe-filename').value.trim(), eng:element('recipe-eng')?.value.trim()||'',las:element('recipe-las')?.value.trim()||'',reference:element('recipe-reference')?.value.trim()||''};
    for(const key of ['verticalFilename','verticalEng','verticalLas']) if(element(`recipe-${key}`)) type.templates[language][key]=element(`recipe-${key}`).value.trim();
    if(type.domain==='neb') type.englishPrefixes=element('profile-english-prefixes').value.split(',').map((value)=>value.trim().toUpperCase()).filter(Boolean);
    else {type.sizes=parseSizes('profile-sizes',false);type.variants=parseSizes('profile-variants',true);}
  }
  function captureDraft() { captureRules(); captureType(); }
  element('profile-select').addEventListener('change', (event)=>{
    try { persist(profiles,event.target.value); draft=selected===standard.id?null:structuredClone(active());typeIndex=0;language='English';renderEditor();onChange(active());status(`Using ${active().name}.`); }
    catch(error) { renderSelector();status(`Unable to save profile selection. ${error.message}`,true); }
  });
  element('profile-copy').addEventListener('click',()=>{draft=editableCopy(active(),uniqueName(`${active().name} Copy`));typeIndex=0;language='English';renderEditor();status('Editable copy created. Give it a name and Save Profile.');});
  element('profile-export').addEventListener('click',async()=>{
    try {const copy=selected===standard.id?editableCopy(standard,'NEB Standard Copy'):active();const saved=await saveText('naming-convention-profile.json',JSON.stringify(copy,null,2),'application/json');if(saved)status('Profile exported.');}
    catch(error){status(`Export failed. ${error.message}`,true);}
  });
  element('profile-export-rules').addEventListener('click',async()=>{
    const profile=active();
    try { if(await exportProfileRulesText(profile))status(`Saved rules for ${profile.name} exported as a text document. Save Profile first to include new edits.`); }
    catch(error){status(`Rules export failed. ${error.message}`,true);}
  });
  function importText(text) {
    if(text.length>1_000_000)throw new Error('Choose a profile smaller than 1 MB.');
    const parsed=JSON.parse(text);
    const profile=editableCopy(parsed,uniqueName(parsed.name));
    validateProfile(profile);persist([...profiles,profile],profile.id);
    draft=structuredClone(profile);typeIndex=0;language='English';renderSelector();renderEditor();onChange(active());status('Profile imported and selected.');
  }
  element('profile-import').addEventListener('click',async()=>{
    if(!isDesktop()){element('profile-import-file').click();return;}
    try {const text=await readProfile();if(text!==null)importText(text);}catch(error){status(`Import failed. ${error.message}`,true);}
  });
  element('profile-import-file').addEventListener('change',async(event)=>{
    try { const file=event.target.files[0];if(!file)return;if(file.size>1_000_000)throw new Error('Choose a profile smaller than 1 MB.');importText(await file.text()); }
    catch(error){status(`Import failed. ${error.message}`,true);}finally{event.target.value='';}
  });
  element('profile-delete').addEventListener('click',()=>{
    if(selected===standard.id)return;
    try{persist(profiles.filter((profile)=>profile.id!==selected),standard.id);draft=null;renderSelector();renderEditor();onChange(active());status('Profile deleted. NEB Standard is selected.');}
    catch(error){status(error.message,true);}
  });
  draft=selected===standard.id?null:structuredClone(active());
  renderSelector();renderEditor();if(storageMessage)status(storageMessage,true);
  return active();
}
