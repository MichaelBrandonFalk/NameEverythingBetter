import {
  DEFAULT_PROFILE_ID, profileNebOutputs, profileArtEntries, profileOptions, typeLanguage,
} from './naming_profiles.mjs?v=2026-10-27-vertical';
import { ART_TASK_DEFAULT_OVERRIDES, EXTRA_USAGE_TO_PREFIX, PLUS_WARNING_MESSAGE, slugify } from './neb_core.mjs?v=2026-10-27-vertical';
import { saveText } from './desktop_bridge.mjs?v=2026-10-27-vertical';

const RECIPE_LABELS = {
  filename: 'Video filename', eng: 'English caption', las: 'Spanish caption', reference: 'External reference',
  verticalFilename: 'Vertical video filename', verticalEng: 'Vertical English caption', verticalLas: 'Vertical Spanish caption',
};
const tagLabel = (tag) => ({ca:'Cover Art (ca)',bg:'Background Art (bg)',tt:'Title Treatment (tt)'})[tag] || `Art tag ${tag}`;
const heading = (text) => `${text}\n${'-'.repeat(Math.min(text.length, 78))}`;
const bullet = (text) => `- ${text}`;

function sampleFields(profile, type, language) {
  const rules = profile.rules;
  const identity = type.fields.some((field)=>field.key==='season') ? 'County Rescue' : 'Be Like Water';
  const sample = {title:identity,language,season:'02',episode:'05',year:'2026',interviewees:'Anthony Hopkins'};
  for (const field of type.fields) {
    if (field.type === 'select' && !['language','art_tag','aspect_ratio','dimensions'].includes(field.key)) {
      sample[field.key] = field.key === 'resolution' && field.options.includes('hd') ? 'hd' : field.options[0];
    } else if (sample[field.key] === undefined) sample[field.key] = 'Example';
  }
  if (type.fields.some((field)=>field.key==='house')) {
    const prefix = language === 'Spanish' ? rules.spanishPrefixes[0] : type.englishPrefixes[0];
    sample.house = `${prefix}${'12345678901234567890'.slice(0,rules.houseDigits)}`;
  }
  if (type.domain === 'art' && type.sizes.length) {
    const size = type.sizes[0];
    Object.assign(sample,{art_tag:size.artTag,aspect_ratio:size.aspectRatio,dimensions:size.dimensions});
  }
  return Object.fromEntries(type.fields.map((field)=>[field.key,sample[field.key]]));
}

function exampleLines(profile, type, language) {
  const languageField = type.fields.find((field)=>field.key==='language');
  if (!languageField && language !== 'English') return ['This type has no Language field; its English recipe is used.'];
  if (languageField?.type === 'select' && !languageField.options.includes(language)) return ['This language is not offered by the Language field.'];
  if (!type.templates[language]?.filename) return ['No filename recipe is configured for this source language.'];
  const fields = sampleFields(profile, type, language);
  const inputs = type.fields.map((field)=>`${field.label}=${fields[field.key]}`).join('; ');
  try {
    if (type.domain === 'art') {
      const [entry] = profileArtEntries(profile,type.name,fields,{mode:'single'});
      return [`Example inputs: ${inputs}`,`Example filename: ${entry.filename}`];
    }
    const output = profileNebOutputs(profile,type.name,fields);
    const lines = [`Example inputs: ${inputs}`,`Video: ${output.filename}`];
    if (output.companionCaptions?.eng) lines.push(`English caption: ${output.companionCaptions.eng}`);
    if (output.companionCaptions?.las) lines.push(`Spanish caption: ${output.companionCaptions.las}`);
    if (output.vertical) {
      lines.push(`Vertical video: ${output.vertical.filename}`);
      if (output.vertical.companionCaptions?.eng) lines.push(`Vertical English caption: ${output.vertical.companionCaptions.eng}`);
      if (output.vertical.companionCaptions?.las) lines.push(`Vertical Spanish caption: ${output.vertical.companionCaptions.las}`);
    }
    if (output.externalReference) lines.push(`External reference: ${output.externalReference}`);
    return lines;
  } catch (error) {
    return [`Example inputs: ${inputs}`,`Example could not be generated: ${error.message}`];
  }
}

function fieldLines(profile, type) {
  return type.fields.map((field) => {
    let description = 'Text';
    if (field.type === 'select') {
      if (type.domain === 'art' && ['aspect_ratio','dimensions'].includes(field.key)) {
        description = 'Dropdown; allowed choices depend on the selected art tag and aspect ratio, as listed below';
      } else {
        const options = profileOptions(profile,type,field.key,{});
        description = `Dropdown: ${options.join(', ')}`;
      }
    }
    return bullet(`${field.label} [${field.key}]: ${description}. Required.`);
  });
}

function typeLines(profile, type, index) {
  const lines = [heading(`${index}. ${type.name}`),...fieldLines(profile,type)];
  const defaultLanguage=type.defaultLanguage || (type.domain==='art'?ART_TASK_DEFAULT_OVERRIDES[type.name]?.language:undefined);
  if (defaultLanguage) lines.push(`Default source language on selection: ${defaultLanguage}.`);
  else if (type.fields.some((field)=>field.key==='language')) lines.push('Source language: use the Language selection; this type does not force a language on selection.');
  if (type.domain === 'neb' && type.fields.some((field)=>field.key==='house')) {
    lines.push(`English house prefixes: ${type.englishPrefixes.join(', ')}. Spanish house prefixes: ${profile.rules.spanishPrefixes.join(', ')}.`);
  }
  if (Object.values(type.templates).some((recipe)=>recipe.reference?.includes('{external_reference}'))) {
    lines.push(`External reference shortening follows the ${type.baseTask || 'Movie'} base type.`);
  }
  for (const language of ['English','Spanish']) {
    const recipes = type.templates[language] || {};
    lines.push('',`${language.toUpperCase()} SOURCE`);
    if (type.domain === 'art') lines.push(`Art filename recipe: ${recipes.filename || '(not configured)'}`);
    else for (const [key,label] of Object.entries(RECIPE_LABELS)) {
      if (recipes[key]) lines.push(`${label} recipe: ${recipes[key]}`);
      else if (['filename','eng','las','reference'].includes(key)) lines.push(`${label}: ${key==='filename'?'not configured':'not produced'}.`);
    }
    lines.push(...exampleLines(profile,type,language));
  }
  if (type.domain === 'art') {
    lines.push('', 'ALLOWED SIZES FOR ONE-AT-A-TIME NAMING');
    const groups = new Map();
    for (const size of type.sizes) {
      const key = `${tagLabel(size.artTag)} / ${size.aspectRatio}`;
      if (!groups.has(key)) groups.set(key,[]);
      if (!groups.get(key).includes(size.dimensions)) groups.get(key).push(size.dimensions);
    }
    for (const [key,dimensions] of groups) lines.push(bullet(`${key}: ${dimensions.join(', ')} pixels.`));
    lines.push('', 'FULL REQUIRED ART SET');
    lines.push('The full-set form asks for the identity fields above; art tag, aspect ratio and dimensions come from the required variants below.');
    if (!type.variants.length) lines.push('No required variants are configured; use one-at-a-time naming or configure a required set.');
    for (const variant of type.variants) lines.push(bullet(`${tagLabel(variant.artTag)} / ${variant.aspectRatio} / ${variant.dimensions} pixels. Tags: ${variant.tags?.length?variant.tags.join('; '):'none'}.`));
    lines.push('These are the final required variants for this profile. Smaller allowed sizes are not automatically additional required deliverables.');
  }
  return lines;
}

export function buildProfileRulesText(profile) {
  const rules = profile.rules;
  const standard = profile.id === DEFAULT_PROFILE_ID;
  const separator = rules.separator === '_' ? 'underscore (_)' : 'hyphen (-)';
  const lines = [
    'NAME EVERYTHING BETTER', 'NAMING CONVENTION RULES', profile.name, '='.repeat(78), '',
    `Profile: ${profile.name}`,
    `Profile status: ${standard?'Protected standard conventions':'Custom saved conventions'}.`,
    'Scope: Movies and Captions and Art. NEB + PathMaker uses its separate standard path rules.',
    'This is a snapshot of the selected saved profile. Later edits do not change this document.', '',
    heading('1. Title and text formatting'),
    bullet(`Letter case: ${({lower:'lowercase',upper:'UPPERCASE',preserve:'keep the typed letter case'})[rules.titleCase]}.`),
    bullet(`Word separator: ${separator}. Leading/trailing word separators are removed from normalized text.`),
    bullet(`Accents: ${rules.stripAccents?'strip accents to their base letters, for example cafe from caf\u00e9':'keep accents in letters'}.`),
    bullet(`Apostrophes: ${rules.apostrophes==='remove'?'remove them, so Bob\'s becomes Bobs before the letter-case rule':'replace them with a word boundary'}.`),
    bullet(`& becomes "${rules.ampersand}"; @ becomes "${rules.at}".`),
    bullet(rules.plus==='context'?'A + with spaces on both sides becomes "and"; other + symbols become "plus".':'Every + becomes "'+rules.plus+'".'),
    bullet(`Exactly three dots between adjacent ${standard?'ASCII letters':'letters'}/numbers become a word boundary. Other periods, middle dots, asterisks and exclamation marks are removed. Nonbreaking spaces are removed.`),
    bullet(`Remaining punctuation and symbol runs become one ${separator}. Repeated word separators collapse.`),
    bullet(standard?'Standard title slugs retain ASCII letters a-z and digits 0-9 after accent cleanup.':'Free-text fields can retain letters and numbers from other alphabets. Dropdown choices keep their configured values.'),
    bullet('Video title cleanup also combines the first "Veggie Tales" phrase into "veggietales".'),
    ...(standard?[]:[bullet(`Final recipe rendering replaces underscore runs with the chosen ${separator} and collapses repeated hyphens.`),bullet('Rendered names cannot contain path separators or Windows-reserved filename characters, end with a period/space, exceed 240 characters, or use reserved device names such as CON.mov.')]),
    bullet(PLUS_WARNING_MESSAGE), '',
    heading('2. Language and caption rules'),
    bullet(`English video/caption language code: ${rules.englishMedia}. Spanish video/caption language code: ${rules.spanishMedia}.`),
    bullet(`English art language code: ${rules.englishArt}. Spanish art language code: ${rules.spanishArt}.`),
    bullet(`Spanish in-name marker, where a recipe uses {spanish_marker}: ${rules.spanishMarker}.`),
    bullet(`English caption type: ${rules.englishCaption}. Spanish caption type: ${rules.spanishCaption}.`),
    ...(standard?[]:[bullet('A configured Caption Type input can override the type used in the primary recipe. Companion captions use the profile defaults for their output languages.')]),
    bullet('The recipes for each type determine which codes appear, where they appear, and which outputs exist.'),
    bullet('Caption recipes use the caption language code. Companion captions keep the source title\'s house number.'),
    bullet('When Spanish is selected, English caption names are hidden until revealed. Spanish batch rows omit English captions unless explicitly included.'),
    bullet('A type without a Language field uses its English recipe. A blank caption recipe omits that output.'), '',
    heading('3. House numbers and numeric fields'),
    bullet(`House numbers: 3 letters followed by exactly ${rules.houseDigits} digits. Letters are uppercase and leading digit zeros are kept.`),
    bullet(`Spanish house prefixes: ${rules.spanishPrefixes.join(', ')}. English prefixes are listed for each video type.`),
    bullet(standard?'Season input: two digits, such as 02, optionally prefixed with s; the filename token is s02.':'Season input: 1 to 999, optionally prefixed with s; the filename token is padded to at least two digits, such as s02.'),
    bullet('Episode input: 1 to 999, optionally prefixed with e; the token is padded to at least two digits, such as e05.'),
    bullet('Year input: exactly four digits. A yearly recipe typically adds s before the year, such as s2026.'),
    bullet('Required fields must be populated. Dropdown values must be among the choices allowed for the selected type.'), '',
    heading('4. Extra type tokens'),
    ...Object.entries(EXTRA_USAGE_TO_PREFIX).map(([usage,prefix])=>bullet(`${usage}: ${prefix}.`)),
    ...(standard?[]:[bullet('For a custom Extra Type choice outside this mapping, {extra} uses its normalized text value.')]), '',
    heading('5. Recipe tokens and external references'),
    'A recipe is the exact filename pattern. A token in braces is replaced by a field value or a derived value. Literal text, such as feature or vert, stays where it appears.',
    bullet('{title}, {interviewees}, and custom free-text tokens use the formatting rules above.'),
    bullet('{season}=s02; {episode}=e05; {year}=2026; {house}=the uppercase house number.'),
    bullet('{language}=the source language code for the current output. Companion caption outputs use their own caption language.'),
    bullet(`{english_media}=${rules.englishMedia}; {spanish_media}=${rules.spanishMedia}; {spanish_marker}=${rules.spanishMarker}.`),
    bullet('{caption_type}=the caption type for that output language; {extra}=the Extra Type token; {resolution}=the selected resolution.'),
    bullet('{art_tag}, {aspect_ratio}, {dimensions}=the selected or required art variant.'),
    bullet('{extension}=png for tt; jpg for other art tags. A literal extension written into a recipe is used as written.'),
    bullet('{external_reference}=the shortened title reference. Keep the first character of each word in uppercase, remove later vowels (a/e/i/o/u), keep consonants and digits, suppress repeated retained consonants, and join without spaces. Episodic base types append uppercase season and episode tokens; yearly base types use the year as the season. The Exclusive Conversation base uses the fixed source title Exclusive Conversations.'),
    'The type-specific recipes and examples below are generated from this profile\'s saved configuration and naming engine.', '',
  ];
  for (const [domain,title,section] of [['neb','Movies and Captions',6],['art','Art',7]]) {
    const types = profile.types.filter((type)=>type.domain===domain);
    lines.push('='.repeat(78),heading(`${section}. ${title}`),`Configured types: ${types.length}.`, '');
    types.forEach((type,index)=>lines.push(...typeLines(profile,type,`${section}.${index+1}`),'',''));
  }
  lines.push('='.repeat(78),heading('8. Batch naming and sharing'),
    bullet('Episode-based video tasks support a single episode, comma lists such as 3,7,8, or ranges such as 1-89. Manual lists are deduplicated and sorted numerically.'),
    bullet('Enter a house number for every selected episode, or upload an Excel/CSV template with one episode per row. House numbers are not assigned automatically.'),
    bullet('Upload templates use the selected type\'s required field keys; house is headed house_number. Use the first worksheet and replace the example rows.'),
    bullet('Video batch results download as Excel workbooks, one file per row. PathMaker adds destination_uri using its own path rules. Art required-set downloads contain the configured filenames and delivery tags.'),
    bullet('Profiles save locally on the device/browser. Export Profile creates an importable JSON backup; this text document is a readable reference.'),
    '', 'END OF PROFILE RULES', '');
  return lines.join('\r\n');
}

export async function exportProfileRulesText(profile) {
  const filename = `${slugify(profile.name) || 'naming_profile'}_rules.txt`;
  return saveText(filename,buildProfileRulesText(profile),'text/plain;charset=utf-8');
}
