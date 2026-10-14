import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../neb_core.mjs';
import { defaultProfile, editableCopy, validateProfile, profileNebOutputs, profileArtEntries, profileSlug, renderRecipe } from '../naming_profiles.mjs';
const standard = defaultProfile();
const sample = { ...core.NEB_DEFAULTS, ...core.ART_DEFAULTS, title:"Romeo + Juliet's Movie", season:'03', episode:'07', year:'2026', interviewees:'Anthony Hopkins', extra_usage:'Deleted Scenes' };

test('editable copies preserve all established type outputs and requirement tags',()=>{
  const profile=editableCopy(standard);validateProfile(profile);
  for(const type of profile.types)for(const language of core.LANGUAGE_OPTIONS){
    const fields={...sample,language,house:`${language==='Spanish'?'LAS':type.englishPrefixes[0]}1234567`};
    if(type.domain==='neb'){
      if(type.name==='Dub Audio'&&language==='English')continue;
      const result=profileNebOutputs(profile,type.name,fields),expected=core.buildNebOutputs(type.name,fields);
      assert.equal(result.filename,expected.filename,type.name);
      assert.deepEqual(result.companionCaptions,expected.companionCaptions,type.name);
      assert.equal(result.externalReference,expected.externalReference,type.name);
    }else assert.deepEqual(profileArtEntries(profile,type.name,fields),core.requiredArtEntries(type.name,fields),type.name);
  }
});

test('rules and language-specific house validation are isolated to the selected profile',()=>{
  const profile=editableCopy(standard);profile.rules.titleCase='upper';profile.rules.spanishMedia='spa';profile.rules.spanishPrefixes=['ESP'];
  const result=profileNebOutputs(profile,'Movie',{...sample,language:'Spanish',house:'ESP1234567'});
  assert.equal(result.filename,'ROMEO_AND_JULIETS_MOVIE_feature_las_hd_ESP1234567_spa.mov');
  assert.match(result.companionCaptions.las,/_cc_spa.vtt$/);
  assert.throws(()=>profileNebOutputs(profile,'Movie',{...sample,language:'Spanish',house:'LAS1234567'}));
  assert.equal(standard.rules.spanishPrefixes[0],'LAS');
});

test('custom types can require new text and dropdown fields and use them in recipes',()=>{
  const profile=editableCopy(standard);
  const custom=structuredClone(profile.types.find(type=>type.domain==='neb'&&type.name==='Movie'));
  custom.name='Social Clip';custom.fields.push({key:'campaign',label:'Campaign',type:'text'},{key:'channel',label:'Channel',type:'select',options:['web','tv']});
  custom.templates.English.filename='{campaign}_{title}_{channel}_{language}.mp4';profile.types.push(custom);validateProfile(profile);
  const result=profileNebOutputs(profile,'Social Clip',{...sample,language:'English',house:'PUR1234567',campaign:'Fall Launch',channel:'web'});
  assert.equal(result.filename,'fall_launch_romeo_and_juliets_movie_web_eng.mp4');
  assert.throws(()=>profileNebOutputs(profile,'Social Clip',{...sample,language:'English',house:'PUR1234567'}));
});

test('multiple episodes keep both resolutions and tags in copied profiles',()=>{
  const profile=editableCopy(standard);
  const rows=profileArtEntries(profile,'Episode',{...sample,language:'English',episodes:'3,7-8,8'},{mode:'set',multiple:true});
  assert.equal(rows.length,6);assert(rows.every(row=>row.tags.length));
  assert.equal(rows.filter(row=>row.filename.includes('1920x1080')).length,3);
});

test('profile JSON round trips and rejects unsafe fields and malformed recipes',()=>{
  const profile=editableCopy(standard);
  validateProfile(JSON.parse(JSON.stringify(profile)));
  profile.types[0].templates.English.filename='{does_not_exist}.mov';assert.throws(()=>validateProfile(profile));
  profile.types[0].templates.English.filename='../{title}.mov';assert.throws(()=>validateProfile(profile));
  profile.types[0].templates.English.filename='{title}.mov';profile.types[0].fields.push({key:'constructor',label:'Constructor',type:'text'});assert.throws(()=>validateProfile(profile));
});

test('title cleanup and cross-platform filename safeguards',()=>{
  const rules=standard.rules;
  assert.equal(profileSlug("Bob's Uncle's Movie",rules),'bobs_uncles_movie');
  assert.equal(profileSlug('Música...para Todos__',rules),'musica_para_todos');
  assert.equal(profileSlug('GFAM+',rules),'gfam_plus');
  for(const recipe of ['CON.mov','../x.mov','x:bad.mov','bad.'])assert.throws(()=>renderRecipe(recipe,{}));
});

test('types without a language field do not inherit a hidden previous language',()=>{
  const profile=editableCopy(standard);
  const type=profile.types.find(type=>type.domain==='neb'&&type.name==='Movie');
  type.fields=type.fields.filter(field=>field.key!=='language');
  const result=profileNebOutputs(profile,'Movie',{...sample,language:'Spanish',house:'PUR1234567'});
  assert.match(result.filename,/_eng.mov$/);
});

test('desktop bridge uses native clipboard and save dialogs',async()=>{
  const calls=[];
  globalThis.__TAURI__={core:{invoke:async(command,args)=>{calls.push({command,args});return true;}}};
  try{
    const bridge=await import('../desktop_bridge.mjs');
    await bridge.copyText('movie.mov');await bridge.saveText('names.csv','filename\nmovie.mov');await bridge.readProfile();
    assert.deepEqual(calls.map(call=>call.command),['copy_text','save_text','load_profile']);
    assert.equal(calls[0].args.text,'movie.mov');
  }finally{delete globalThis.__TAURI__;}
});
