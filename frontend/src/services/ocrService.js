import { createWorker } from 'tesseract.js';

/**
 * Client-Side OCR & Strict Document Verification Parser for Indian Identity Documents
 */

const IGNORED_HEADER_KEYWORDS = [
  'GOVERNMENT OF INDIA', 'GOVT OF INDIA', 'UNIQUE IDENTIFICATION AUTHORITY OF INDIA',
  'AUTHORITY OF INDIA', 'UIDAI', 'BHARAT SARKAR', 'MERI PEHCHAN', 'MERA AADHAAR',
  'AADHAAR', 'ENROLMENT', 'HELP@UIDAI.GOV.IN', 'WWW.UIDAI.GOV.IN', '1947',
  'INCOME TAX DEPARTMENT', 'PERMANENT ACCOUNT NUMBER', 'SIGNATURE',
  'ELECTION COMMISSION OF INDIA', 'ELECTOR PHOTO IDENTITY CARD', 'EPIC',
  'DRIVING LICENCE', 'DRIVING LICENSE', 'UNION OF INDIA', 'STATE TRANSPORT DEPARTMENT',
  'MOTOR VEHICLES ACT', 'FORM 7', 'REPUBLIC OF INDIA', 'PASSPORT', 'INDIAN CITIZEN',
  'SARATHI', 'PARIVAHAN'
];

const CERTIFICATE_KEYWORDS = [
  'CERTIFICATE OF', 'CERTIFICATE', 'CERTIFY THAT', 'THIS IS TO CERTIFY',
  'PROUDLY PRESENTED TO', 'AWARDED TO', 'PRESENTED TO', 'SUCCESSFULLY COMPLETED',
  'COMPLETION OF', 'FOR PARTICIPATION', 'PARTICIPATED IN', 'IN APPRECIATION OF',
  'CERTIFICATE OF MERIT', 'CERTIFICATE OF APPRECIATION', 'CERTIFICATE OF ACHIEVEMENT',
  'DIPLOMA IN', 'BACHELOR OF', 'MASTER OF', 'DEGREE OF', 'ACADEMIC YEAR',
  'SEMINAR ON', 'WORKSHOP ON', 'TRAINING PROGRAMME', 'FACULTY OF',
  'COURSE COMPLETION', 'STUDENT ID', 'GRADE SHEET', 'TRANSCRIPT OF',
  'MARKSHEET', 'HEAD OF DEPARTMENT', 'PRINCIPAL SIGNATURE',
  'TAX INVOICE', 'COMMERCIAL INVOICE', 'BILL OF SUPPLY', 'ESTIMATE / QUOTATION'
];

const GOVT_AUTHORITY_MARKERS = [
  'UNIQUE IDENTIFICATION AUTHORITY', 'UIDAI',
  'ELECTION COMMISSION OF INDIA', 'ELECTOR PHOTO IDENTITY',
  'MINISTRY OF ROAD TRANSPORT', 'UNION DRIVING LICENCE',
  'STATE TRANSPORT DEPARTMENT', 'MOTOR VEHICLES ACT',
  'INCOME TAX DEPARTMENT', 'PERMANENT ACCOUNT NUMBER',
  'REPUBLIC OF INDIA PASSPORT'
];

function isIgnoredLine(line) {
  const upper = (line || '').toUpperCase().trim();
  if (upper.length < 2) return true;
  if (/^[^a-zA-Z0-9]+$/.test(upper)) return true;
  return IGNORED_HEADER_KEYWORDS.some(kw => upper === kw || upper.startsWith(kw + ' ') || upper.endsWith(' ' + kw));
}

/**
 * Preprocesses an image base64 on an in-memory HTML Canvas:
 * - Upscales low-res scans to optimal OCR DPI
 * - Applies contrast stretching and grayscale for sharp character recognition
 */
function preprocessImageForOCR(imageBase64) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.document) {
      resolve(imageBase64);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        let w = img.width;
        let h = img.height;
        // Upscale if smaller than 1200px
        const maxDim = Math.max(w, h);
        let scale = 1;
        if (maxDim < 1200) {
          scale = Math.min(2.5, 1600 / maxDim);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // Grayscale + Contrast stretching
        let minVal = 255;
        let maxVal = 0;
        for (let i = 0; i < d.length; i += 4) {
          const lum = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
          if (lum < minVal) minVal = lum;
          if (lum > maxVal) maxVal = lum;
          d[i] = lum;
          d[i + 1] = lum;
          d[i + 2] = lum;
        }

        const range = maxVal - minVal || 1;
        for (let i = 0; i < d.length; i += 4) {
          let v = Math.round(((d[i] - minVal) / range) * 255);
          // slight threshold boost
          if (v < 110) v = Math.max(0, v - 30);
          else if (v > 160) v = Math.min(255, v + 25);
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        resolve(imageBase64);
      }
    };
    img.onerror = () => resolve(imageBase64);
    img.src = imageBase64;
  });
}

// Reusable worker instance
let sharedWorker = null;
let isWorkerInitializing = false;

async function getOrCreateWorker() {
  if (sharedWorker) return sharedWorker;
  if (isWorkerInitializing) {
    // Wait briefly for init
    await new Promise(r => setTimeout(r, 500));
    if (sharedWorker) return sharedWorker;
  }
  isWorkerInitializing = true;
  try {
    sharedWorker = await createWorker('eng');
    isWorkerInitializing = false;
    return sharedWorker;
  } catch (e) {
    isWorkerInitializing = false;
    throw e;
  }
}

export const ocrService = {
  /**
   * Run client-side OCR on base64/blob image and parse document fields
   */
  extractFromImage: async (imageBase64, preferredDocType = null) => {
    try {
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return { success: false, is_valid_document: false, text: '', fields: {}, detectedType: null };
      }

      // Preprocess image for maximum text clarity
      const preprocessed = await preprocessImageForOCR(imageBase64);

      let text = '';
      try {
        const worker = await getOrCreateWorker();
        const ret = await worker.recognize(preprocessed);
        text = ret.data.text || '';
      } catch (workerErr) {
        // Fallback: create fresh worker if singleton failed
        console.warn('Re-initializing Tesseract worker after error:', workerErr);
        sharedWorker = null;
        const freshWorker = await createWorker('eng');
        const ret = await freshWorker.recognize(preprocessed);
        await freshWorker.terminate();
        text = ret.data.text || '';
      }

      return ocrService.parseExtractedText(text, preferredDocType);
    } catch (err) {
      console.warn('Client OCR extraction error:', err);
      return { success: false, is_valid_document: false, text: '', fields: {}, detectedType: null, error: err.message };
    }
  },

  /**
   * Parse raw OCR text into structured document fields with strict identity validation.
   */
  parseExtractedText: (rawText, preferredDocType = null) => {
    if (!rawText || rawText.trim().length < 5) {
      return {
        success: false,
        is_valid_document: false,
        fields: {},
        detectedType: null,
        error: 'NO_TEXT_DETECTED: No readable identity text found in the uploaded image.'
      };
    }

    const fullText = rawText.toUpperCase();
    const cleanLines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // ── Check 1: Strict Certificate & Non-Identity Document Rejection ──
    const hasGovtAuthority = GOVT_AUTHORITY_MARKERS.some(auth => fullText.includes(auth));
    const matchedCertTerm = CERTIFICATE_KEYWORDS.find(term => fullText.includes(term));

    if (matchedCertTerm && !hasGovtAuthority) {
      return {
        success: false,
        is_valid_document: false,
        fields: {},
        detectedType: null,
        error: `DOCUMENT_STRUCTURE_REJECTED: Uploaded file contains certificate / academic markers ("${matchedCertTerm}"). Identity screening strictly accepts only official Indian Government IDs (Aadhaar, Voter ID, or Driving License).`
      };
    }

    // ── Check 2: Check for Genuine Official Government ID Markers ──
    const hasAadhaarMarkers = /AADHAAR|UIDAI|UNIQUE IDENTIFICATION|MERA AADHAAR|MERI PEHCHAN|ENROLMENT|BHARAT SARKAR|\b\d{4}\s\d{4}\s\d{4}\b|\b[Xx\d]{4}\s[Xx\d]{4}\s\d{4}\b/i.test(fullText);
    const hasDlMarkers = /DRIVING LICEN[SC]E|DL NO|TRANSPORT DEPARTMENT|MOTOR VEHICLE|AUTHORISATION TO DRIVE|FORM 7|SARATHI|PARIVAHAN|\b[A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4}[-\s]?[0-9]{7}\b/i.test(fullText);
    const hasVoterMarkers = /ELECTION COMMISSION|ELECTOR PHOTO|BHARAT NIRVACHAN|NIRVACHAN SADAN|EPIC|\b[A-Z]{3}[0-9]{7}\b/i.test(fullText);

    let detectedType = null;
    if (hasAadhaarMarkers) {
      detectedType = 'AADHAAR_CARD';
    } else if (hasDlMarkers) {
      detectedType = 'DRIVING_LICENSE';
    } else if (hasVoterMarkers) {
      detectedType = 'VOTER_ID';
    }

    // If preferredDocType is passed, verify if document has at least partial evidence of that type
    if (!detectedType && preferredDocType) {
      if (preferredDocType === 'AADHAAR_CARD' && (hasAadhaarMarkers || /\b\d{4}\s\d{4}\b/.test(fullText))) {
        detectedType = 'AADHAAR_CARD';
      } else if (preferredDocType === 'DRIVING_LICENSE' && (hasDlMarkers || /LICEN[SC]E|VEHICLE|VALID/i.test(fullText))) {
        detectedType = 'DRIVING_LICENSE';
      } else if (preferredDocType === 'VOTER_ID' && (hasVoterMarkers || /COMMISSION|ELECTOR|EPIC/i.test(fullText))) {
        detectedType = 'VOTER_ID';
      }
    }

    // If still no valid identity structure detected:
    if (!detectedType) {
      return {
        success: false,
        is_valid_document: false,
        fields: {},
        detectedType: null,
        error: 'DOCUMENT_STRUCTURE_REJECTED: Document does not match approved Aadhaar, Voter ID, or Driving License structures.'
      };
    }

    const fields = {};

    // ── Extract Date of Birth (DOB) ──
    const dobMatch = rawText.match(/(?:DOB|D\.O\.B|Date of Birth|Birth|Year of Birth|YOB|जन्म तिथि)[:\s\.\-]*(\d{2}[/-]\d{2}[/-]\d{4}|\d{4})/i)
      || rawText.match(/\b(\d{2}[/-]\d{2}[/-]\d{4})\b/);
    if (dobMatch) {
      fields.dob = dobMatch[1].replace(/-/g, '/');
    }

    // ── Extract Gender ──
    if (/\b(FEMALE|WOMAN|महिला)\b/i.test(rawText)) {
      fields.gender = 'FEMALE';
    } else if (/\b(MALE|MAN|पुरुष)\b/i.test(rawText)) {
      fields.gender = 'MALE';
    } else if (/\b(TRANSGENDER)\b/i.test(rawText)) {
      fields.gender = 'TRANSGENDER';
    }

    // ── Type-Specific Field Extraction (Strictly from real text - NEVER hardcoding sample records!) ──
    if (detectedType === 'AADHAAR_CARD') {
      const uidMatch = rawText.match(/\b(\d{4}\s\d{4}\s\d{4})\b/)
        || rawText.match(/\b([Xx\d]{4}\s[Xx\d]{4}\s\d{4})\b/i)
        || rawText.match(/\b(\d{12})\b/)
        || rawText.match(/(?:Your\s+Aadhaar\s+No|Aadhaar\s+No|UID)[:\s\.\-]*([Xx\d\s]{12,14})/i);

      if (uidMatch) {
        const rawNum = uidMatch[1].replace(/\s/g, '').toUpperCase();
        if (rawNum.length === 12) {
          fields.document_number = `${rawNum.slice(0, 4)} ${rawNum.slice(4, 8)} ${rawNum.slice(8, 12)}`;
        } else {
          fields.document_number = uidMatch[1].trim().toUpperCase();
        }
      }

      // Name extraction
      for (let i = 0; i < cleanLines.length; i++) {
        const line = cleanLines[i].trim();
        const upper = line.toUpperCase();
        if (/^(TO|RECIPIENT)[:\s]*$/i.test(line) && i + 1 < cleanLines.length) {
          const nextLine = cleanLines[i + 1].trim();
          if (/^[A-Za-z\s\.]+$/.test(nextLine) && !isIgnoredLine(nextLine)) {
            fields.full_name = nextLine.toUpperCase();
            break;
          }
        }
        if (!fields.full_name && /^[A-Z][a-zA-Z\s\.\']{2,40}$/.test(line) && !isIgnoredLine(line)) {
          if (!/\b(GOVERNMENT|INDIA|AUTHORITY|AADHAAR|INFORMATION|HELP|ENROLMENT|STREET|ROAD|NAGAR|TAMIL|WEST|EAST|NORTH|SOUTH|MALE|FEMALE|YEAR|BIRTH|DOB)\b/i.test(upper)) {
            fields.full_name = line.toUpperCase();
            break;
          }
        }
      }

    } else if (detectedType === 'DRIVING_LICENSE') {
      // DL Number Extraction
      const dlMatch = rawText.match(/(?:DL\s*NO|LICEN[SC]E\s*NO|NO\.?)[:\s\-]*([A-Z0-9\/\-\s]{10,20})/i)
        || rawText.match(/\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4}[-\s]?[0-9]{7})\b/)
        || rawText.match(/\b([A-Z]{2}[0-9]{2}\s?[0-9]{11})\b/)
        || rawText.match(/\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4,11})\b/);

      if (dlMatch) {
        fields.document_number = dlMatch[1].replace(/[\s\-]/g, '').toUpperCase();
      }

      // Expiry Date Extraction
      const expMatch = rawText.match(/(?:Valid(?:ity)?|Expiry|Exp|NT)[:\s\w\-]*(\d{2}[/-]\d{2}[/-]\d{4})/i);
      if (expMatch) {
        fields.expiry_date = expMatch[1].replace(/-/g, '/');
      }

      // Vehicle Class Extraction
      const classMatch = rawText.match(/\b(LMV(?:-GV)?|MCWG|MCWOG|TRANS|HMV|3W-NT)\b/i);
      if (classMatch) {
        fields.vehicle_class = classMatch[1].toUpperCase();
      }

      // Name Extraction
      const nameMatch = rawText.match(/(?:Name|Holder\'?s?\s*Name)[:\s\-]+([A-Za-z\s\.]+)/i);
      if (nameMatch) {
        const candidate = nameMatch[1].trim().toUpperCase();
        if (candidate && !isIgnoredLine(candidate)) {
          fields.full_name = candidate;
        }
      }

      if (!fields.full_name) {
        for (const line of cleanLines) {
          if (line.toLowerCase().includes('name') && !line.toLowerCase().includes('father')) {
            const namePart = line.replace(/name\s*[:\-]?\s*/i, '').trim();
            if (namePart && !isIgnoredLine(namePart) && /^[A-Za-z\s\.]+$/.test(namePart)) {
              fields.full_name = namePart.toUpperCase();
              break;
            }
          }
        }
      }

    } else if (detectedType === 'VOTER_ID') {
      const epicMatch = rawText.match(/\b([A-Z]{3}[0-9]{7})\b/)
        || rawText.match(/(?:EPIC\s*NO|CARD\s*NO)[:\s\-]*([A-Z0-9]{10})/i);
      if (epicMatch) {
        fields.document_number = (epicMatch[1] || epicMatch[0]).replace(/\s/g, '').toUpperCase();
      }

      const nameMatch = rawText.match(/(?:Elector\'?s?\s*Name|Name)[:\s\-]+([A-Za-z\s\.]+)/i);
      if (nameMatch) {
        const candidate = nameMatch[1].trim().toUpperCase();
        if (candidate && !isIgnoredLine(candidate)) {
          fields.full_name = candidate;
        }
      }

      if (!fields.full_name) {
        for (const line of cleanLines) {
          if (line.toLowerCase().includes('name') && !line.toLowerCase().includes('father')) {
            const namePart = line.replace(/name\s*[:\-]?\s*/i, '').trim();
            if (namePart && !isIgnoredLine(namePart) && /^[A-Za-z\s\.]+$/.test(namePart)) {
              fields.full_name = namePart.toUpperCase();
              break;
            }
          }
        }
      }
    }

    const hasExtractedData = Object.keys(fields).length > 0;

    return {
      success: hasExtractedData,
      is_valid_document: true,
      detectedType,
      fields,
      rawText
    };
  }
};
