// utils/parseTranscript.js
import * as FileSystem from 'expo-file-system';

const GRADE_RE = /\b(A\+|A-|A|B\+|B-|B|C\+|C-|C|D\+|D-|D|F|P|NP|S|U)\b/i;

export function parseTranscriptText(text) {
  if (!text || typeof text !== 'string') return [];

  return text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.includes(',')
        ? line.split(',')
        : line.split(/\s*-\s*/);
      const semester = parts.find(p => /\b(Spring|Summer|Fall|Winter)\b/i.test(p)) || null;
      const grade = (parts.find(p => GRADE_RE.test(p)) || '').toUpperCase();
      const creditsRaw = parts.find(p => /^\d+(\.\d+)?$/.test(p));
      const credits = creditsRaw ? parseFloat(creditsRaw) : null;
      const name = parts.find(
        p => p !== semester && p !== grade && p !== creditsRaw
      ) || 'Unknown Course';

      return { name, semester, grade, credits };
    });
}

export async function parseTranscriptFile(uri) {
  try {
    const text = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return parseTranscriptText(text);
  } catch (e) {
    console.warn('Transcript read error:', e);
    return [];
  }
}

// Placeholder — real PDF parsing needs extra setup
export async function parseTranscriptPDF(uri) {
  console.warn('PDF parsing not implemented — upload .txt or .csv for now.');
  return [];
}
