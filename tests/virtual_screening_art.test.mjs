import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../neb_core.mjs';
import {defaultProfile,editableCopy,profileArtEntries,validateProfile} from '../naming_profiles.mjs';
import {defaultProfileDocument} from '../export_default_profile.mjs';
import {buildProfileRulesText} from '../profile_rules_text.mjs';
const fields={...core.ART_DEFAULTS,title:'Wild Like Me'};

test('Virtual Screening requires the identical Movie variants and tags in both languages',()=>{
  for(const language of core.LANGUAGE_OPTIONS){
    const values={...fields,language};
    const movie=core.requiredArtEntries('Movie',values);
    const screening=core.requiredArtEntries('Virtual Screening',values);
    assert.deepEqual(screening,movie.map(entry=>({...entry,filename:entry.filename.replace('wild_like_me_','wild_like_me_virtual_screening_')})));
    assert(screening.every(entry=>entry.tags.length));
    assert(screening.some(entry=>entry.filename.endsWith('_tt_9x5_1800x1000.png')));
    assert(screening.some(entry=>entry.filename.endsWith('_ca_16x9_3840x2160.jpg')));
    assert(core.TAGGED_REQUIRED_ART_TASKS.has('Virtual Screening'));
  }
});
test('one-at-a-time Virtual Screening art allows every Movie tag, ratio and dimension',()=>{
  assert.deepEqual(core.allowedArtTagCodes('Virtual Screening'),core.allowedArtTagCodes('Movie'));
  for(const tag of core.allowedArtTagCodes('Movie')){
    assert.deepEqual(core.allowedAspectRatios(tag,'Virtual Screening'),core.allowedAspectRatios(tag,'Movie'));
    for(const ratio of core.allowedAspectRatios(tag,'Movie')){
      const dimensions=core.allowedDimensions(ratio,tag,'Movie');
      assert.deepEqual(core.allowedDimensions(ratio,tag,'Virtual Screening'),dimensions);
      for(const size of dimensions){
        const filename=core.buildArtFilename('Virtual Screening',{...fields,art_tag:tag,aspect_ratio:ratio,dimensions:size});
        assert(filename.startsWith('wild_like_me_virtual_screening_eng_'));
        assert(filename.endsWith(tag==='tt'?'.png':'.jpg'));
      }
    }
  }
  assert.deepEqual(core.allowedArtTagCodes('Virtual Screening Episode'),['bg']);
});
test('standard and fresh custom profiles, public feed and rules export include the shared requirement set',()=>{
  const standard=defaultProfile(),copy=editableCopy(standard);validateProfile(copy);
  const screening=standard.types.find(type=>type.domain==='art'&&type.name==='Virtual Screening');
  const movie=standard.types.find(type=>type.domain==='art'&&type.name==='Movie');
  assert.deepEqual(screening.variants,movie.variants);assert.deepEqual(screening.sizes,movie.sizes);
  for(const language of core.LANGUAGE_OPTIONS){
    const values={...fields,language};
    assert.deepEqual(profileArtEntries(copy,'Virtual Screening',values),core.requiredArtEntries('Virtual Screening',values));
  }
  const feed=defaultProfileDocument('test');
  assert.deepEqual(feed.profile.types.find(type=>type.domain==='art'&&type.name==='Virtual Screening').variants,movie.variants);
  const text=buildProfileRulesText(standard);
  assert(text.includes('wild_like_me_virtual_screening')||text.includes('be_like_water_virtual_screening_eng_ca_'));
});
