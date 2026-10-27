import { unzipSync } from './vendor/fflate.mjs';

export function parseCsv(text) {
  const rows=[];let row=[],value='',quoted=false;
  const input=String(text).replace(/^\ufeff/,'');
  for(let i=0;i<input.length;i++){
    const character=input[i];
    if(character==='"'){
      if(quoted&&input[i+1]==='"'){value+='"';i++;}else if(!value||quoted)quoted=!quoted;else throw new Error('Invalid CSV quoting.');
    }else if(!quoted&&(character===','||character==='\n'||character==='\r')){
      row.push(value);value='';
      if(character!==','){rows.push(row);row=[];if(character==='\r'&&input[i+1]==='\n')i++;}
    }else value+=character;
  }
  if(quoted)throw new Error('The CSV has an unclosed quote.');
  if(value||row.length){row.push(value);rows.push(row);}
  return rows;
}
const tags=(node,name)=>Array.from(node.getElementsByTagNameNS('*',name));
function xml(bytes){
  if(!bytes)throw new Error('This workbook is missing a required worksheet file.');
  const text=new TextDecoder().decode(bytes);
  if(/<!DOCTYPE|<!ENTITY/i.test(text))throw new Error('Unsupported workbook XML.');
  const doc=new DOMParser().parseFromString(text,'application/xml');
  if(tags(doc,'parsererror').length)throw new Error('Unable to read this workbook.');
  return doc;
}
export function workbookRows(bytes){
  let expanded=0;
  const files=unzipSync(bytes,{filter:(entry)=>{
    if(!/^xl\/(?:workbook\.xml|sharedStrings\.xml|_rels\/workbook\.xml\.rels|worksheets\/[^/]+\.xml)$/.test(entry.name))return false;
    expanded+=entry.originalSize;
    if(entry.originalSize>10_000_000||expanded>16_000_000)throw new Error('The workbook is too large. Use an episode template with fewer rows.');
    return true;
  }});
  const book=xml(files['xl/workbook.xml']);
  const first=tags(book,'sheet')[0];
  if(!first)throw new Error('The workbook has no worksheets.');
  const relationships=xml(files['xl/_rels/workbook.xml.rels']);
  const id=first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||first.getAttribute('r:id');
  const relation=tags(relationships,'Relationship').find((node)=>node.getAttribute('Id')===id);
  if(!relation||relation.getAttribute('TargetMode')==='External')throw new Error('Unsupported worksheet location.');
  const target=relation.getAttribute('Target');
  const path=new URL(target,'https://workbook.local/xl/').pathname.slice(1);
  if(!path.startsWith('xl/worksheets/'))throw new Error('Unsupported worksheet location.');
  const sheet=xml(files[path]);
  const strings=files['xl/sharedStrings.xml']?tags(xml(files['xl/sharedStrings.xml']),'si').map((node)=>tags(node,'t').map((part)=>part.textContent).join('')):[];
  const rows=[];
  for(const node of tags(sheet,'row')){
    const row=[];
    for(const cell of tags(node,'c')){
      const reference=cell.getAttribute('r')||'';
      let column=0;
      for(const character of reference.match(/^[A-Z]+/)?.[0]||'A')column=column*26+character.charCodeAt(0)-64;
      if(column>100)throw new Error('Use the template headers in the first columns of the sheet.');
      const type=cell.getAttribute('t');
      const value=tags(cell,'v')[0]?.textContent||'';
      if(tags(cell,'f').length&&!value)throw new Error('Paste formula results as values before uploading.');
      if(type==='e')throw new Error('The spreadsheet contains a cell error. Correct it before uploading.');
      row[column-1]=type==='s'?(strings[Number(value)]||''):type==='inlineStr'?tags(cell,'t').map((part)=>part.textContent).join(''):value;
    }
    rows.push(row);
    if(rows.length>1000)throw new Error('Upload at most 999 episode rows.');
  }
  return rows;
}

export function episodeRecords(rows, requiredFields) {
  const nonempty=rows.filter((row)=>row.some((value)=>String(value??'').trim()));
  if(nonempty.length<2)throw new Error('Add at least one episode row under the headers.');
  const aliases={house_number:'house',series_title:'title',parent_sku:'sku'};
  const headers=nonempty[0].map((value)=>{const key=String(value??'').trim().toLowerCase().replace(/\s+/g,'_');return aliases[key]||key;});
  const namedHeaders=headers.filter(Boolean);
  if(new Set(namedHeaders).size!==namedHeaders.length)throw new Error('Spreadsheet headers must be unique.');
  const missing=requiredFields.filter((key)=>!headers.includes(key));
  if(missing.length)throw new Error(`Missing required headers: ${missing.map((key)=>key==='house'?'house_number':key).join(', ')}.`);
  if(nonempty.length>1000)throw new Error('Upload at most 999 episode rows.');
  return nonempty.slice(1).map((row,index)=>{
    const record=Object.create(null);
    for(const key of requiredFields){
      let value=String(row[headers.indexOf(key)]??'').trim();
      if(!value)throw new Error(`Row ${index+2}: ${key==='house'?'house_number':key} is required.`);
      if(key==='language'){
        const options={english:'English',eng:'English',spanish:'Spanish',es:'Spanish',las:'Spanish'};
        value=options[value.toLowerCase()]||value;
      }
      if(key==='season'||key==='episode'){
        value=value.replace(/^[se]/i,'');
        if(!/^\d+$/.test(value)||Number(value)<1||Number(value)>999)throw new Error(`Row ${index+2}: ${key} must be between 1 and 999.`);
        value=String(Number(value)).padStart(2,'0');
      }
      record[key]=value;
    }
    return record;
  });
}
export async function readEpisodeFile(file, requiredFields){
  if(!file||file.size>5_000_000)throw new Error('Choose an Excel or CSV file smaller than 5 MB.');
  let rows;
  if(/\.csv$/i.test(file.name))rows=parseCsv(await file.text());
  else if(/\.xlsx$/i.test(file.name))rows=workbookRows(new Uint8Array(await file.arrayBuffer()));
  else throw new Error('Upload an .xlsx or .csv file.');
  return episodeRecords(rows,requiredFields);
}
export function episodeTemplate(fields, values = {}){
  const keys=fields.map((field)=>typeof field==='string'?field:field.key);
  const headers=keys.map((key)=>key==='house'?'house_number':key);
  const example={title:'Amor Secreto',language:values.language||'Spanish',season:'01',year:'2026',resolution:'hd',sku:'bcdef123-4567-890a-bcde-f1234567890b',interviewees:'Example Guest',extra_usage:'Deleted Scenes'};
  return [headers,...[1,2].map((episode)=>keys.map((key)=>key==='episode'?String(episode).padStart(2,'0'):key==='house'?`${example.language==='Spanish'?'LAS':'PUR'}000300${episode}`:example[key]||'Example'))];
}
