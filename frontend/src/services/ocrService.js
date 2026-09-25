import { createWorker } from 'tesseract.js';

/**
 * Client-Side OCR & Strict Document Verification Parser for Indian & International Identity Documents
 */

const IGNORED_HEADER_KEYWORDS = [
  'GOVERNMENT OF INDIA', 'GOVT OF INDIA', 'UNIQUE IDENTIFICATION AUTHORITY OF INDIA',
  'AUTHORITY OF INDIA', 'UIDAI', 'BHARAT SARKAR', 'MERI PEHCHAN', 'MERA AADHAAR',
  'AADHAAR', 'ENROLMENT', 'HELP@UIDAI.GOV.IN', 'WWW.UIDAI.GOV.IN', '1947',
  'INCOME TAX DEPARTMENT', 'PERMANENT ACCOUNT NUMBER', 'SIGNATURE',
  'ELECTION COMMISSION OF INDIA', 'ELECTOR PHOTO IDENTITY CARD', 'EPIC',
  'DRIVING LICENCE', 'DRIVING LICENSE', 'UNION OF INDIA', 'STATE TRANSPORT DEPARTMENT',
  'MOTOR VEHICLES ACT', 'FORM 7', 'REPUBLIC OF INDIA', 'PASSPORT', 'INDIAN CITIZEN'
];

function isIgnoredLine(line) {
  const upper = (line || '').toUpperCase().trim();
  if (upper.length < 2) return true;
  if (/^[^a-zA-Z0-9]+$/.test(upper)) return true;
  return IGNORED_HEADER_KEYWORDS.some(kw => upper === kw || upper.startsWith(kw + ' ') || upper.endsWith(' ' + kw));
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

      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageBase64);
      await worker.terminate();

      const text = ret.data.text || '';
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

    // ── Check for Official Government ID Markers ──────────────────────────────
    const hasAadhaarMarkers = /AADHAAR|UIDAI|UNIQUE IDENTIFICATION|MERA AADHAAR|MERI PEHCHAN|ENROLMENT|YOUR AADHAAR|\b\d{4}\s\d{4}\s\d{4}\b|\b[Xx\d]{4}\s[Xx\d]{4}\s\d{4}\b/i.test(fullText);
    const hasPanMarkers = /INCOME TAX|PERMANENT ACCOUNT|AAYAKAR|\b[A-Z]{5}[0-9]{4}[A-Z]\b/i.test(fullText);
    const hasPassportMarkers = /PASSPORT|REPUBLIC OF INDIA|P<IND|P<[A-Z]{3}|<<<<</i.test(fullText);
    const hasDlMarkers = /DRIVING LICEN[SC]E|DL NO|TRANSPORT DEPARTMENT|MOTOR VEHICLE|AUTHORISATION TO DRIVE/i.test(fullText);
    const hasVoterMarkers = /ELECTION COMMISSION|ELECTOR PHOTO|BHARAT NIRVACHAN|EPIC|\b[A-Z]{3}[0-9]{7}\b/i.test(fullText);
    const hasGeneralGovtMarkers = /GOVERNMENT OF INDIA|GOVT OF INDIA|BHARAT SARKAR|DATE OF BIRTH|YEAR OF BIRTH/i.test(fullText);

    // If NO recognized document markers exist in OCR text and no preferred doc type
    const isRecognizedDocument = hasAadhaarMarkers || hasPanMarkers || hasPassportMarkers || hasDlMarkers || hasVoterMarkers || hasGeneralGovtMarkers || preferredDocType;

    if (!isRecognizedDocument) {
      return {
        success: false,
        is_valid_document: false,
        fields: {},
        detectedType: null,
        error: 'NON_DOCUMENT_IMAGE: The uploaded image is not a recognized Government Identity Document (Aadhaar, Voter ID, Driving License, PAN, or Passport).'
      };
    }

    // 1. Detect Document Type based on confirmed markers
    let detectedType = preferredDocType || 'AADHAAR_CARD';
    if (hasAadhaarMarkers) {
      detectedType = 'AADHAAR_CARD';
    } else if (hasPanMarkers) {
      detectedType = 'PAN_CARD';
    } else if (hasPassportMarkers) {
      detectedType = 'PASSPORT';
    } else if (hasDlMarkers) {
      detectedType = 'DRIVING_LICENSE';
    } else if (hasVoterMarkers) {
      detectedType = 'VOTER_ID';
    }

    const fields = {};

    // 2. Extract Date of Birth (DOB)
    const dobMatch = rawText.match(/(?:DOB|D\.O\.B|Date of Birth|Birth|Year of Birth|YOB|பிறந்த\s*நாள்|பிறந்த\s*ஆண்டு|जन्म तिथि)[:\s\.\-]*(\d{2}[/-]\d{2}[/-]\d{4}|\d{4})/i)
      || rawText.match(/\b(\d{2}[/-]\d{2}[/-]\d{4})\b/);
    if (dobMatch) {
      fields.dob = dobMatch[1].replace(/-/g, '/');
    }

    // 3. Extract Gender
    if (/\b(FEMALE|WOMAN|பெண்|महिला)\b/i.test(rawText)) {
      fields.gender = 'FEMALE';
    } else if (/\b(MALE|MAN|ஆண்|पुरुष)\b/i.test(rawText)) {
      fields.gender = 'MALE';
    } else if (/\b(TRANSGENDER|திருநங்கை)\b/i.test(rawText)) {
      fields.gender = 'TRANSGENDER';
    }

    // 4. Type Specific Number & Name Extraction
    if (detectedType === 'AADHAAR_CARD') {
      // Aadhaar UID (Supports standard 12-digit and masked XXXX XXXX 1234 formats)
      const uidMatch = rawText.match(/\b(\d{4}\s\d{4}\s\d{4})\b/)
        || rawText.match(/\b([X\d]{4}\s[X\d]{4}\s\d{4})\b/i)
        || rawText.match(/\b(\d{12})\b/)
        || rawText.match(/(?:Your\s+Aadhaar\s+No|Aadhaar\s+No|UID)[:\s\.\-]*([X\d\s]{12,14})/i);

      if (uidMatch) {
        const rawNum = uidMatch[1].replace(/\s/g, '').toUpperCase();
        if (rawNum.length === 12) {
          fields.document_number = `${rawNum.slice(0, 4)} ${rawNum.slice(4, 8)} ${rawNum.slice(8, 12)}`;
        } else {
          fields.document_number = uidMatch[1].trim().toUpperCase();
        }
      }

      // Name extraction for Aadhaar Letter / Card
      for (let i = 0; i < cleanLines.length; i++) {
        const line = cleanLines[i].trim();
        const upper = line.toUpperCase();

        // Check for line after "To" or "பெறுநர்"
        if (/^(TO|பெறுநர்|RECIPIENT)[:\s]*$/i.test(line) && i + 1 < cleanLines.length) {
          const nextLine = cleanLines[i + 1].trim();
          if (/^[A-Za-z\s\.]+$/.test(nextLine) && !isIgnoredLine(nextLine)) {
            fields.full_name = nextLine.toUpperCase();
            break;
          }
        }

        // Check standard name line (pure English letters, not header keywords)
        if (!fields.full_name && /^[A-Z][a-zA-Z\s\.\']{2,40}$/.test(line) && !isIgnoredLine(line)) {
          if (!/\b(GOVERNMENT|INDIA|AUTHORITY|AADHAAR|INFORMATION|HELP|ENROLMENT|STREET|ROAD|NAGAR|TAMIL|WEST|EAST|NORTH|SOUTH|MALE|FEMALE)\b/i.test(upper)) {
            const words = line.split(/\s+/).filter(w => w.length > 1);
            if (words.length >= 1 && words.length <= 4) {
              fields.full_name = line.toUpperCase();
            }
          }
        }
      }

      // Address extraction for Aadhaar
      const addrMatch = rawText.match(/(?:Address|முகவரி)[:\s\.\-]*([\s\S]{15,150}?)(?:\b\d{6}\b|Phone|Mobile|www\.uidai)/i);
      if (addrMatch) {
        fields.address = addrMatch[1].replace(/[\n\r]+/g, ', ').replace(/\s{2,}/g, ' ').trim();
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

    const hasExtractedData = Object.keys(fields).length > 0;

    return {
      success: hasExtractedData,
      is_valid_document: true,
      detectedType: detectedType || preferredDocType,
      fields,
      rawText
    };
  }
};
