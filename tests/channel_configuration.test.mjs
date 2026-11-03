import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../neb_core.mjs';
import { defaultProfile, editableCopy, profileNebOutputs, validateProfile } from '../naming_profiles.mjs';
import { buildPathmakerPath } from '../neb_pathmaker_core.mjs';
import { episodeRecords, episodeTemplate } from '../spreadsheet_input.mjs';
import { buildProfileRulesText } from '../profile_rules_text.mjs';
const sample={...core.NEB_DEFAULTS,title:'Wild Like Me',season:'02',episode:'05',year:'2026',interviewees:'Example Guest',extra_usage:'Deleted Scenes'};

test('every MOV type maps every channel choice, without changing companion captions or references',()=>{
  for(const [task,type] of Object.entries(core.NEB_TASKS)){
    if(!type.fields.includes('channel_configuration'))continue;
    for(const language of core.LANGUAGE_OPTIONS){
      const fields={...sample,language,house:`${language==='Spanish'?'LAS':type.housePrefixes[0]}0001051`};
      const before=core.buildNebOutputs(task,fields);
      assert.match(before.filename,/_20_(eng|es)\.mov$/);
      for(const [label,code] of Object.entries(core.CHANNEL_CONFIGURATION_SLUGS)){
        const output=core.buildNebOutputs(task,{...fields,channel_configuration:label});
        assert.equal(output.filename,before.filename.replace('_20_',`_${code}_`));
        assert.deepEqual(output.companionCaptions,before.companionCaptions);
        assert.equal(output.externalReference,before.externalReference);
        assert.equal(buildPathmakerPath(task,{...fields,sku:'example'}),buildPathmakerPath(task,{...fields,sku:'example',channel_configuration:label}));
        if(before.vertical){
          assert.equal(output.vertical.filename,before.vertical.filename.replace('_20_',`_${code}_`));
          assert.deepEqual(output.vertical.companionCaptions,before.vertical.companionCaptions);
        }
      }
      assert.throws(()=>core.buildNebOutputs(task,{...fields,channel_configuration:'99'}),/Channel Configuration/);
    }
  }
});
test('descriptions and codes normalize safely and stereo is the fallback',()=>{
  for(const [label,code] of Object.entries(core.CHANNEL_CONFIGURATION_SLUGS)){
    assert.equal(core.channelConfigurationSlug(label),code);assert.equal(core.channelConfigurationSlug(code),code);
  }
  assert.equal(core.channelConfigurationSlug(),'20');assert.equal(core.channelConfigurationSlug(''),'20');
  for(const value of ['__proto__','toString','constructor'])assert.throws(()=>core.channelConfigurationSlug(value),/Channel Configuration/);
  assert(!core.NEB_TASKS.Caption.fields.includes('channel_configuration'));
  assert(!core.NEB_TASKS['Dub Audio'].fields.includes('channel_configuration'));
  assert.equal(core.buildNebFilename('Caption',{...sample,house:'PUR0001051',channel_configuration:'invalid'}),core.buildNebFilename('Caption',{...sample,house:'PUR0001051'}));
});
test('new profile copies map audio tokens and saved legacy recipes are preserved',()=>{
  const profile=editableCopy(defaultProfile());validateProfile(profile);
  for(const type of profile.types.filter(t=>t.domain==='neb'&&t.fields.some(f=>f.key==='channel_configuration'))){
    const fields={...sample,house:type.englishPrefixes[0]+'0001051',channel_configuration:'Stems only (Dialogue, Music, Effects)'};
    assert.deepEqual(profileNebOutputs(profile,type.name,fields).filename,core.buildNebOutputs(type.name,fields).filename);
    assert.match(type.templates.English.filename,/\{audio_trk\}/);
  }
  const movie=profile.types.find(t=>t.domain==='neb'&&t.name==='Movie');
  movie.fields=movie.fields.filter(f=>f.key!=='channel_configuration');
  movie.templates.English.filename='{title}_feature_{resolution}_{house}_{language}.mov';
  assert.equal(profileNebOutputs(profile,'Movie',{...sample,house:'PUR0001051'}).filename,'wild_like_me_feature_hd_PUR0001051_eng.mov');
  assert(buildProfileRulesText(defaultProfile()).includes('Stems only (Dialogue, Music, Effects): DME'));
});
test('spreadsheet templates include channel configuration and old sheets default to stereo',()=>{
  const fields=core.NEB_TASKS.Episode.fields;
  const template=episodeTemplate(fields,{channel_configuration:'Surround audio only'});
  assert.equal(episodeRecords(template,fields)[0].channel_configuration,'Surround audio only');
  const index=template[0].indexOf('channel_configuration');
  const legacy=template.map(row=>row.filter((_,i)=>i!==index));
  assert.equal(episodeRecords(legacy,fields)[0].channel_configuration,'Stereo audio only');
  template[1][index]='';assert.equal(episodeRecords(template,fields)[0].channel_configuration,'Stereo audio only');
});
