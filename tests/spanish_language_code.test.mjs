import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../neb_core.mjs';
import {buildPathmakerPath} from '../neb_pathmaker_core.mjs';
import {defaultProfile,editableCopy,profileNebOutputs,profileArtEntries,upgradeLegacySpanishCodes,validateProfile} from '../naming_profiles.mjs';
import {outputRows,spreadsheetRows} from '../episode_workflow.mjs';
import {buildProfileRulesText} from '../profile_rules_text.mjs';
const sample={...core.NEB_DEFAULTS,...core.ART_DEFAULTS,title:'County Rescue',language:'Spanish',season:'03',episode:'01',year:'2026',interviewees:'Example Guest',extra_usage:'Deleted Scenes',house:'LAS0002223',sku:'bcdef123-4567-890a-bcde-f1234567890a'};

test('movie and episode destinations exactly match the requested Spanish format',()=>{
  const movie={...sample,title:'Wild Like Me',house:'LAS0001051',sku:'abcdef12-3456-7890-abcd-ef1234567890'};
  assert.equal(buildPathmakerPath('Movie',movie)+core.buildNebOutputs('Movie',movie).filename,'s3://gacm-axinom-staging/movies/wild_like_me_abcdef12-3456-7890-abcd-ef1234567890/feature_es/wild_like_me_feature_es_hd_LAS0001051_20_es.mov');
  assert.equal(buildPathmakerPath('Episode',sample)+core.buildNebOutputs('Episode',sample).filename,'s3://gacm-axinom-staging/series/county_rescue_bcdef123-4567-890a-bcde-f1234567890a/s03_es/e01/county_rescue_s03_e01_es_hd_LAS0002223_20_es.mov');
  assert.equal(core.buildNebOutputs('Movie',movie).companionCaptions.las,'wild_like_me_feature_es_hd_LAS0001051_cc_es.vtt');
  assert.equal(core.buildArtFilename('Movie',{...core.ART_DEFAULTS,title:'Bob',language:'Spanish',art_tag:'bg',aspect_ratio:'16x9',dimensions:'3840x2160'}),'bob_es_bg_16x9_3840x2160.jpg');
});
test('all standard Spanish media, captions, paths and art use es; LAS house numbers stay uppercase',()=>{
  for(const task of Object.keys(core.NEB_TASKS)){
    const output=core.buildNebOutputs(task,sample);
    assert(!output.filename.includes('_las'),task);assert(output.filename.includes('LAS0002223'),task);
    for(const caption of Object.values(output.companionCaptions||{}))assert(!caption.includes('_las'),task);
    const folder=buildPathmakerPath(task,sample);assert(!folder.includes('_las'),task);
  }
  for(const task of Object.keys(core.ART_TASKS)){
    const entries=core.requiredArtEntries(task,sample);
    assert(entries.length,task);assert(entries.every(({filename})=>filename.includes('_es_')&&!filename.includes('_las_')),task);
  }
  const fields={...sample,title:'Las Vegas'};
  assert(core.buildNebOutputs('Movie',fields).filename.startsWith('las_vegas_feature_es_'));
  assert.throws(()=>core.buildNebOutputs('Movie',{...sample,house:'PUR0002223'}),/LAS/);
});
test('Spanish spreadsheet output and profile rules documents reflect es',()=>{
  const output=core.buildNebOutputs('Episode',sample);
  const rows=outputRows(output,sample,{pathFor:()=>buildPathmakerPath('Episode',sample)});
  const sheet=spreadsheetRows(rows).flat().join('\n');assert(!sheet.includes('_las'));assert(sheet.includes('s03_es/e01/'));
  const doc=buildProfileRulesText(defaultProfile());assert(doc.includes('Spanish art language code: es'));assert(!doc.includes('_las'));
});
test('custom copies retain independent Spanish marker and output-language recipes',()=>{
  const profile=editableCopy(defaultProfile());profile.rules.spanishMedia='spa';profile.rules.spanishMarker='mx';profile.rules.spanishArt='spa';
  const result=profileNebOutputs(profile,'Movie',sample);
  assert.equal(result.filename,'county_rescue_feature_mx_hd_LAS0002223_20_spa.mov');
  assert.equal(result.companionCaptions.las,'county_rescue_feature_mx_hd_LAS0002223_cc_spa.vtt');
  assert(result.companionCaptions.eng.endsWith('_cc_eng.vtt'));
  assert(profileArtEntries(profile,'Movie',sample).every(({filename})=>filename.includes('_spa_')));
});
test('legacy saved and imported codes upgrade once without mutating originals or house rules',()=>{
  const old=editableCopy(defaultProfile());delete old.spanishCodeRevision;
  Object.assign(old.rules,{spanishMedia:'las',spanishMarker:'las',spanishArt:'las'});
  const snapshot=JSON.stringify(old),upgraded=upgradeLegacySpanishCodes(old);validateProfile(upgraded);
  assert.equal(JSON.stringify(old),snapshot);assert.equal(upgraded.id,old.id);assert.deepEqual(upgraded.rules.spanishPrefixes,['LAS']);
  for(const key of ['spanishMedia','spanishMarker','spanishArt'])assert.equal(upgraded.rules[key],'es');
  assert(profileNebOutputs(upgraded,'Movie',sample).filename.includes('_feature_es_'));
  upgraded.rules.spanishArt='spa';assert.equal(upgradeLegacySpanishCodes(upgraded).rules.spanishArt,'spa');
  const custom=structuredClone(old);custom.rules.spanishMedia='spa';assert.equal(upgradeLegacySpanishCodes(custom).rules.spanishMedia,'spa');
  assert.deepEqual(upgraded.types,old.types);
});
