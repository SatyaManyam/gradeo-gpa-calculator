// utils/parseDegreePlan.js
import * as FileSystem from 'expo-file-system';

// Expected CSV columns (order flexible): code,name,credits,category,required
// required: Y/N or true/false
export async function parseDegreeFile(uri, filename = '') {
  const isCSV = /\.csv$/i.test(filename) || filename?.includes('.csv');
  const isTXT = /\.txt$/i.test(filename) || filename?.includes('.txt');

  try {
    const raw = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
    const text = raw.replace(/\r\n/g, '\n').trim();

    if (isCSV) return parseCSV(text);
    if (isTXT) return parseTXT(text);

    // Unknown text format: try CSV first, then TXT
    const tryCsv = parseCSV(text, true);
    if (tryCsv.length) return tryCsv;
    return parseTXT(text, true);
  } catch (e) {
    console.log('Degree plan parse error:', e);
    return [];
  }
}

function parseCSV(text, loose = false) {
  const lines = text.split('\n').filter(Boolean);
  if (!lines.length) return [];
  let headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  let startIdx = 1;

  // If loose mode, assume header if first line contains any alpha chars
  if (loose && headers.length < 3) {
    headers = ['code','name','credits','category','required'];
    startIdx = 0;
  }

  const idx = {
    code: headers.indexOf('code'),
    name: headers.indexOf('name'),
    credits: headers.indexOf('credits'),
    category: headers.indexOf('category'),
    required: headers.indexOf('required'),
  };

  const rows = [];
  for (let i = startIdx; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    rows.push(toReq(cols, idx));
  }
  return rows.filter(Boolean);
}

function splitCsvLine(line) {
  // Simple CSV splitter handling quotes
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' ) {
      if (inQ && line[i+1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      out.push(cur.trim()); cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseTXT(text, loose = false) {
  // Very forgiving lines like: CS 1336, Programming Fundamentals, 3, core, Y
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const rows = [];
  for (const l of lines) {
    const parts = l.split(/\s*,\s*/);
    if (parts.length < 2 && !loose) continue;
    const [code='', name='', credits='3', category='elective', required='N'] = parts;
    rows.push({
      code, name,
      credits: Number(credits) || 3,
      category: category || 'elective',
      required: parseBool(required)
    });
  }
  return rows;
}

function toReq(cols, idx) {
  const code = pull(cols, idx.code) || '';
  const name = pull(cols, idx.name) || '';
  const credits = Number(pull(cols, idx.credits) || 3) || 3;
  const category = pull(cols, idx.category) || 'elective';
  const required = parseBool(pull(cols, idx.required) ?? 'N');
  if (!code && !name) return null;
  return { code, name, credits, category, required };
}

function pull(arr, i) { return i >= 0 && i < arr.length ? arr[i] : undefined; }
function parseBool(v='') {
  const s = String(v).trim().toLowerCase();
  return s === 'y' || s === 'yes' || s === 'true' || s === '1';
}
