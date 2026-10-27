import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultProfile,editableCopy} from '../naming_profiles.mjs';
import {buildProfileRulesText,exportProfileRulesText} from '../profile_rules_text.mjs';

test('standard rules document describes every type, recipe and art requirement',()=>{
  const profile=defaultProfile(),before=JSON.stringify(profile);
  const text=buildProfileRulesText(profile);
  assert(text.includes('Protected standard conventions'));
  assert(text.includes('Spanish video/caption language code: es'));
  assert(text.includes('Spanish art language code: las'));
  for(const type of profile.types){
    assert(text.includes(type.name));
    for(const recipes of Object.values(type.templates))for(const recipe of Object.values(recipes))if(recipe)assert(text.includes(recipe));
    for(const variant of type.variants)assert(text.includes(variant.dimensions));
  }
  assert(text.includes('_vert_hd_PUR1234567_20_eng.mov'));
  assert(text.includes('Tags: syndication; Axinom'));
  assert(!text.includes('Example could not be generated'));
  assert.equal(JSON.stringify(profile),before);
});

test('custom rules, fields, choices and recipe examples use the selected profile',()=>{
  const profile=editableCopy(defaultProfile(),'Studio Delivery');
  Object.assign(profile.rules,{titleCase:'upper',separator:'-',spanishMedia:'spa',spanishArt:'spa',spanishCaption:'sub',spanishPrefixes:['ESP'],houseDigits:5,plus:'plus',stripAccents:false});
  const type=structuredClone(profile.types.find(type=>type.domain==='neb'&&type.name==='Movie'));
  type.name='Campaign Clip';
  type.fields.push({key:'campaign',label:'Campaign Name',type:'select',options:['autumn','winter']});
  type.templates.English.filename='{title}_{campaign}_{house}.mp4';profile.types.push(type);
  const text=buildProfileRulesText(profile);
  for(const phrase of ['Studio Delivery','Letter case: UPPERCASE','hyphen (-)','Spanish video/caption language code: spa','Spanish art language code: spa','Spanish caption type: sub','exactly 5 digits','Spanish house prefixes: ESP','Every + becomes "plus"','Campaign Clip','Dropdown: autumn, winter','BE-LIKE-WATER-autumn-PUR12345.mp4'])assert(text.includes(phrase),phrase);
  assert(!text.includes('Example could not be generated'));
});

test('missing example inputs are reported without hiding the saved recipe',()=>{
  const profile=editableCopy(defaultProfile());
  const type=profile.types.find(type=>type.domain==='neb'&&type.name==='Movie');
  type.fields=type.fields.filter(field=>field.key!=='house');
  const text=buildProfileRulesText(profile);
  assert(text.includes(type.templates.English.filename));
  assert(text.includes('Example could not be generated:'));
});

test('language text fields can still produce examples',()=>{
  const profile=editableCopy(defaultProfile());
  const type=profile.types.find(type=>type.domain==='neb'&&type.name==='Movie');
  type.fields.find(field=>field.key==='language').type='text';
  const text=buildProfileRulesText(profile);
  assert(!text.includes('Example could not be generated'));
  assert(text.includes('be_like_water_feature_hd_PUR1234567_eng.mov'));
});

test('native export writes a UTF-8 text document named for the selected profile',async()=>{
  const calls=[];globalThis.__TAURI__={core:{invoke:async(command,args)=>{calls.push({command,args});return true;}}};
  try{
    assert.equal(await exportProfileRulesText(editableCopy(defaultProfile(),'Studio Delivery')),true);
    assert.equal(calls[0].command,'save_text');assert.equal(calls[0].args.filename,'studio_delivery_rules.txt');
    assert(calls[0].args.text.includes('Profile: Studio Delivery'));
    assert(calls[0].args.text.endsWith('END OF PROFILE RULES\r\n'));
  }finally{delete globalThis.__TAURI__;}
});
