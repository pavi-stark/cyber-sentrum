import { createWorker } from 'tesseract.js';

/**
 * Client-Side OCR & Regex Parser for Indian & International Identity Documents
 */

const IGNORED_NAME_KEYWORDS = [
  'GOVERNMENT', 'INDIA', 'UIDAI', 'UNIQUE', 'IDENTIFICATION', 'AUTHORITY',
  'AADHAAR', 'ENROLMENT', 'HELP', 'HELP@UIDAI', 'WWW.UIDAI.GOV.IN', 'MERAAADHAAR',
  'MERA', 'MERA AADHAAR', 'MERI PEHCHAN', 'DATE OF BIRTH', 'DOB', 'YEAR OF BIRTH',
  'YOB', 'GENDER', 'MALE', 'FEMALE', 'TRANSGENDER', 'ADDRESS', 'TO', 'FATHER',
  'HUSBAND', 'SON OF', 'DAUGHTER OF', 'WIFE OF', 'CARE OF', 'C/O', 'S/O', 'D/O', 'W/O',
  'INCOME TAX DEPARTMENT', 'GOVT OF INDIA', 'PERMANENT ACCOUNT NUMBER', 'SIGNATURE',
  'CARD', 'NATIONAL', 'REPUBLIC', 'PASSPORT', 'TRAVEL', 'DOCUMENT', 'ELECTION',
  'COMMISSION', 'ELECTOR', 'PHOTO', 'IDENTITY', 'DRIVING', 'LICENCE', 'LICENSE',
  'UNION OF INDIA', 'STATE', 'TRANSPORT', 'DEPARTMENT', 'BHARAT', 'SARKAR', 'AAYAKAR'
];

function isIgnoredLine(line) {
  const upper = (line || '').toUpperCase().trim();
  if (upper.length < 3) return true;
  if (/^[^a-zA-Z0-9]+$/.test(upper)) return true;
  return IGNORED_NAME_KEYWORDS.some(kw => upper === kw || upper.startsWith(kw + ' ') || upper.endsWith(' ' + kw));
}

export const ocrService = {
  /**
   * Run client-side OCR on base64/blob image and parse document fields
   */
  extractFromImage: async (imageBase64, preferredDocType = null) => {
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageBase64);
      await worker.terminate();

      const text = ret.data.text || '';
      return ocrService.parseExtractedText(text, preferredDocType);
    } catch (err) {
      console.warn('Client OCR extraction error:', err);
      return { success: false, text: '', fields: {}, detectedType: null };
    }
  },

  /**
   * Parse raw OCR text into structured document fields
   */
  parseExtractedText: (rawText, preferredDocType = null) => {
    if (!rawText) return { success: false, fields: {}, detectedType: null };

    const cleanLines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const fullText = rawText.toUpperCase();

    // 1. Detect Document Type if not specified
    let detectedType = preferredDocType;
    if (!detectedType) {
      if (/AADHAAR|UIDAI|UNIQUE IDENTIFICATION|\b\d{4}\s\d{4}\s\d{4}\b/i.test(fullText)) {
        detectedType = 'AADHAAR_CARD';
      } else if (/INCOME TAX|PERMANENT ACCOUNT|[A-Z]{5}[0-9]{4}[A-Z]/i.test(fullText)) {
        detectedType = 'PAN_CARD';
      } else if (/PASSPORT|P<IND|P<[A-Z]{3}/i.test(fullText)) {
        detectedType = 'PASSPORT';
      } else if (/DRIVING LICEN[SC]E|DL NO|TRANSPORT DEPARTMENT/i.test(fullText)) {
        detectedType = 'DRIVING_LICENSE';
      } else if (/ELECTION COMMISSION|ELECTOR PHOTO|EPIC|\b[A-Z]{3}[0-9]{7}\b/i.test(fullText)) {
        detectedType = 'VOTER_ID';
      } else {
        detectedType = 'AADHAAR_CARD';
      }
    }

    const fields = {};

    // 2. Extract Date of Birth (DOB)
    const dobMatch = rawText.match(/(?:DOB|D\.O\.B|Date of Birth|Birth|Year of Birth|YOB|जन्म तिथि)[:\s]*(\d{2}[/-]\d{2}[/-]\d{4}|\d{4})/i)
      || rawText.match(/\b(\d{2}[/-]\d{2}[/-]\d{4})\b/);
    if (dobMatch) {
      fields.dob = dobMatch[1].replace(/-/g, '/');
    }

    // 3. Extract Gender
    if (/\b(FEMALE|WOMAN|महिला)\b/i.test(rawText)) {
      fields.gender = 'FEMALE';
    } else if (/\b(MALE|MAN|पुरुष)\b/i.test(rawText)) {
      fields.gender = 'MALE';
    } else if (/\b(TRANSGENDER)\b/i.test(rawText)) {
      fields.gender = 'TRANSGENDER';
    }

    // 4. Type Specific Number & Name Extraction
    if (detectedType === 'AADHAAR_CARD') {
      // Aadhaar 12-digit UID
      const uidMatch = rawText.match(/\b(\d{4}\s\d{4}\s\d{4})\b/) || rawText.match(/\b(\d{12})\b/);
      if (uidMatch) {
        const rawNum = uidMatch[1].replace(/\s/g, '');
        fields.document_number = `${rawNum.slice(0, 4)} ${rawNum.slice(4, 8)} ${rawNum.slice(8, 12)}`;
      }

      // Name extraction heuristic for Aadhaar
      for (let i = 0; i < cleanLines.length; i++) {
        const line = cleanLines[i];
        if (!isIgnoredLine(line) && /^[A-Z][a-zA-Z\s\.\']{2,40}$/.test(line)) {
          const words = line.split(/\s+/).filter(w => w.length > 1);
          if (words.length >= 2 && words.length <= 4) {
            if (!/\d/.test(line)) {
              fields.full_name = line.trim().toUpperCase();
              break;
            }
          }
        }
      }
    } else if (detectedType === 'PAN_CARD') {
      const panMatch = rawText.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
      if (panMatch) {
        fields.document_number = panMatch[1].toUpperCase();
      }

      for (const line of cleanLines) {
        if (!isIgnoredLine(line) && /^[A-Z\s\.]{3,40}$/.test(line)) {
          const words = line.split(/\s+/).filter(w => w.length > 1);
          if (words.length >= 2 && !fields.full_name) {
            fields.full_name = line.trim().toUpperCase();
            break;
          }
        }
      }
    } else if (detectedType === 'PASSPORT') {
      const passMatch = rawText.match(/\b([A-Z][0-9]{7,8})\b/);
      if (passMatch) {
        fields.document_number = passMatch[1].toUpperCase();
      }

      const mrzLines = cleanLines.filter(l => l.includes('<<') || l.startsWith('P<'));
      if (mrzLines.length >= 1) {
        const line1 = mrzLines[0];
        const nameParts = line1.replace(/^P<[A-Z]{3}/, '').split('<<');
        if (nameParts.length >= 1) {
          const surname = nameParts[0].replace(/</g, ' ').trim();
          const givenName = (nameParts[1] || '').replace(/</g, ' ').trim();
          fields.full_name = `${givenName} ${surname}`.trim().toUpperCase();
        }
      }
    } else if (detectedType === 'DRIVING_LICENSE') {
      const dlMatch = rawText.match(/\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4,11})\b/);
      if (dlMatch) {
        fields.document_number = dlMatch[1].replace(/[-\s]/g, '').toUpperCase();
      }

      for (const line of cleanLines) {
        if (line.toLowerCase().includes('name') && !line.toLowerCase().includes('father')) {
          const namePart = line.replace(/name\s*[:\-]?\s*/i, '').trim();
          if (namePart && !isIgnoredLine(namePart)) {
            fields.full_name = namePart.toUpperCase();
            break;
          }
        }
      }
    } else if (detectedType === 'VOTER_ID') {
      const epicMatch = rawText.match(/\b([A-Z]{3}[0-9]{7})\b/);
      if (epicMatch) {
        fields.document_number = epicMatch[1].toUpperCase();
      }

      for (const line of cleanLines) {
        if (line.toLowerCase().includes('name') && !line.toLowerCase().includes('father')) {
          const namePart = line.replace(/name\s*[:\-]?\s*/i, '').trim();
          if (namePart && !isIgnoredLine(namePart)) {
            fields.full_name = namePart.toUpperCase();
            break;
          }
        }
      }
    }

    return {
      success: Object.keys(fields).length > 0,
      detectedType,
      fields,
      rawText
    };
  }
};
