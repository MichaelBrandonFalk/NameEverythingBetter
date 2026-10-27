import { saveBytes } from './desktop_bridge.mjs?v=2026-10-27-vertical';
const xml = (value) => String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const encode = (value) => new TextEncoder().encode(value);
const crcTable = Array.from({length:256},(_,value)=>{
  let crc=value;for(let bit=0;bit<8;bit++)crc=crc&1?0xedb88320^(crc>>>1):crc>>>1;return crc>>>0;
});
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function header(size, fields){const bytes=new Uint8Array(size),view=new DataView(bytes.buffer);for(const [offset,value,width] of fields){if(width===2)view.setUint16(offset,value,true);else view.setUint32(offset,value,true);}return bytes;}
function concatenate(parts){const result=new Uint8Array(parts.reduce((size,part)=>size+part.length,0));let offset=0;for(const part of parts){result.set(part,offset);offset+=part.length;}return result;}
// XLSX is an OOXML ZIP. Store entries without compression so exports work offline without a runtime dependency.
function zip(files){
  const entries=[],directory=[];let offset=0;
  for(const [name,text] of Object.entries(files)){
    const filename=encode(name),bytes=encode(text),crc=crc32(bytes);
    const local=header(30,[[0,0x04034b50,4],[4,20,2],[6,0x800,2],[12,0x21,2],[14,crc,4],[18,bytes.length,4],[22,bytes.length,4],[26,filename.length,2]]);
    const central=header(46,[[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x800,2],[14,0x21,2],[16,crc,4],[20,bytes.length,4],[24,bytes.length,4],[28,filename.length,2],[42,offset,4]]);
    entries.push(local,filename,bytes);directory.push(central,filename);offset+=local.length+filename.length+bytes.length;
  }
  const central=concatenate(directory),count=Object.keys(files).length;
  const end=header(22,[[0,0x06054b50,4],[8,count,2],[10,count,2],[12,central.length,4],[16,offset,4]]);
  return concatenate([...entries,central,end]);
}
function columnName(index){let name='';for(let value=index+1;value;value=Math.floor((value-1)/26))name=String.fromCharCode(65+(value-1)%26)+name;return name;}
export function createSpreadsheet(rows){
  if(!rows.length||!rows[0].length)throw new Error('No spreadsheet rows to export.');
  const last=`${columnName(rows[0].length-1)}${rows.length}`;
  const contents=rows.map((row,index)=>`<row r="${index+1}"${index===0?' ht="28" customHeight="1"':''}>${row.map((value,col)=>`<c r="${columnName(col)}${index+1}" t="inlineStr" s="${index===0?1:0}"><is><t xml:space="preserve">${xml(value)}</t></is></c>`).join('')}</row>`).join('');
  const widths=rows[0].map((name,index)=>`<col min="${index+1}" max="${index+1}" width="${name==='filename'?78:name==='destination_uri'?120:Math.max(14,String(name).length+4)}" customWidth="1"/>`).join('');
  return zip({
    '[Content_Types].xml':'<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    '_rels/.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml':'<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Episode Names" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'xl/styles.xml':'<?xml version="1.0"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF8F4F1D"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"><alignment vertical="top"/></xf><xf numFmtId="49" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    'xl/worksheets/sheet1.xml':`<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${last}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>${widths}</cols><sheetData>${contents}</sheetData><autoFilter ref="A1:${last}"/></worksheet>`,
  });
}
export async function downloadSpreadsheet(filename, rows){
  return saveBytes(filename,createSpreadsheet(rows),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
