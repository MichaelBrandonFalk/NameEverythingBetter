import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildNebOutputs,NEB_TASKS} from '../neb_core.mjs';
import {buildPathmakerPath,PATHMAKER_TASKS} from '../neb_pathmaker_core.mjs';
import {outputRows,episodeInputs,spreadsheetRows} from '../episode_workflow.mjs';
import {createSpreadsheet} from '../spreadsheet_export.mjs';
import {episodeRecords,parseCsv,episodeTemplate} from '../spreadsheet_input.mjs';
import {defaultProfile,editableCopy,profileNebOutputs,validateProfile} from '../naming_profiles.mjs';
import {unzipSync} from '../vendor/fflate.mjs';
const fields={title:'Amor Secreto',language:'Spanish',season:'01',episode:'01',resolution:'hd',house:'LAS0003001',sku:'bcdef123-4567-890a-bcde-f1234567890b'};
test('vertical type sits below Episode and defaults to Spanish in both tools',()=>{
  for(const tasks of [NEB_TASKS,PATHMAKER_TASKS]){
    const keys=Object.keys(tasks);assert.equal(keys[keys.indexOf('Episode')+1],'Vertical Episodes');assert.equal(tasks['Vertical Episodes'].defaultLanguage,'Spanish');
  }
});
test('exact horizontal and vertical destinations for both supplied examples',()=>{
  for(const episode of [1,2]){
    const values={...fields,episode:String(episode).padStart(2,'0'),house:`LAS000300${episode}`};
    const result=buildNebOutputs('Vertical Episodes',values);
    const rows=outputRows(result,values,{pathFor:vertical=>buildPathmakerPath('Vertical Episodes',values,{vertical})});
    const prefix=`s3://gacm-axinom-staging/series/amor_secreto_${fields.sku}/s01/e0${episode}`;
    const base=`amor_secreto_s01_e0${episode}`;
    assert.deepEqual(rows.map(row=>row.destination_uri),[
      `${prefix}/${base}_hd_LAS000300${episode}_20_es.mov`,`${prefix}/${base}_hd_LAS000300${episode}_cc_es.vtt`,
      `${prefix}_vert/${base}_vert_hd_LAS000300${episode}_20_es.mov`,`${prefix}_vert/${base}_vert_hd_LAS000300${episode}_cc_es.vtt`,
    ]);
    assert(rows.every(row=>row.house_number===values.house));
  }
});
test('ordinary episode naming and Spanish folder rules remain unchanged',()=>{
  assert.equal(buildNebOutputs('Episode',fields).filename,'amor_secreto_s01_e01_las_hd_LAS0003001_es.mov');
  assert.match(buildPathmakerPath('Episode',fields),/\/s01_las\/e01\/$/);
});
test('manual batches demand each exact house number, without assigning a sequence',()=>{
  const input={...fields,episodes:'3,7-8'};
  assert.throws(()=>episodeInputs(input,{multiple:true,houses:{'03':'LAS0003003'}}),/episode 07/);
  const result=episodeInputs(input,{multiple:true,houses:{'03':'LAS0003003','07':'LAS0099999','08':'LAS0012345'}});
  assert.deepEqual(result.map(row=>[row.episode,row.house]),[['03','LAS0003003'],['07','LAS0099999'],['08','LAS0012345']]);
});
test('profile copies retain vertical recipes and use custom codes',()=>{
  const profile=editableCopy(defaultProfile());validateProfile(profile);
  const expected=buildNebOutputs('Vertical Episodes',fields);
  const actual=profileNebOutputs(profile,'Vertical Episodes',fields);
  assert.equal(actual.filename,expected.filename);assert.deepEqual(actual.vertical,expected.vertical);
  profile.rules.spanishMedia='spa';assert.match(profileNebOutputs(profile,'Vertical Episodes',fields).vertical.filename,/_20_spa.mov$/);
});
test('templates, CSV parsing and numeric Excel episodes preserve row associations',()=>{
  const keys=PATHMAKER_TASKS['Vertical Episodes'].fields;
  const template=episodeTemplate(keys,{language:'Spanish'});
  const records=episodeRecords(template,keys);
  assert.equal(records.length,2);assert.equal(records[1].house,'LAS0003002');assert.equal(records[1].episode,'02');
  const csv='title,language,season,episode,resolution,house_number\n"Amor, Secreto",Spanish,1,2,hd,LAS0003002\n';
  const [row]=episodeRecords(parseCsv(csv),NEB_TASKS['Vertical Episodes'].fields);
  assert.equal(row.title,'Amor, Secreto');assert.equal(row.season,'01');assert.equal(row.episode,'02');
  assert.throws(()=>episodeRecords([['title'],['Example']],keys),/Missing required headers/);
});
test('export is a valid OOXML workbook with frozen/filterable headers and literal strings',()=>{
  const rows=outputRows(buildNebOutputs('Vertical Episodes',fields),fields,{pathFor:vertical=>buildPathmakerPath('Vertical Episodes',fields,{vertical})});
  const bytes=createSpreadsheet(spreadsheetRows(rows));const files=unzipSync(bytes);
  const xml=new TextDecoder().decode(files['xl/worksheets/sheet1.xml']);
  assert(xml.includes('state="frozen"'));assert(xml.includes('<autoFilter'));assert(xml.includes('t="inlineStr"'));assert(xml.includes('destination_uri'));
  writeFileSync(join(tmpdir(),'neb-vertical-episodes-test.xlsx'),bytes);
});

test('native external links bind only once when the bridge has multiple module URLs',async()=>{
  let registrations=0;
  globalThis.document={addEventListener:()=>{registrations++;}};
  globalThis.__TAURI__={core:{invoke:async()=>true}};
  try{
    await import('../desktop_bridge.mjs?test-bridge-one');
    await import('../desktop_bridge.mjs?test-bridge-two');
    assert.equal(registrations,1);
  }finally{delete globalThis.document;delete globalThis.__TAURI__;delete globalThis.__nebExternalLinksBound;}
});
