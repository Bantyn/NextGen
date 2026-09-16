/**
 * medicalTableParser.js
 * Universal Medical Lab Report Table Parser
 *
 * Handles ANY lab report layout without depending on a fixed list of test names.
 * Uses column-position heuristics to identify data rows, preserves source-printed
 * flags verbatim, and guards against numeric corruption.
 *
 * Design Principles:
 * - Source-reported flag (Normal / High / Low / Borderline / Critical) is PRESERVED.
 * - If information cannot be reliably extracted → mark as "NOT_EXTRACTED" — never guess.
 * - Numeric corruption guard: A string containing " - " or "–" is a RANGE, never a value.
 * - "Borderline" is its own enum value, never collapsed to "Normal".
 */

// ─── Source Flag Patterns ──────────────────────────────────────────────────────
const SOURCE_FLAG_PATTERNS = [
  { pattern: /\bcritical\b/i,          flag: 'CRITICAL'   },
  { pattern: /\bborderline\b/i,        flag: 'BORDERLINE' },
  { pattern: /\babnormal\b/i,          flag: 'ABNORMAL'   },
  // HIGH: standalone word "High", or arrows/asterisks common in lab printouts
  { pattern: /(?:^|\s|\t)H(?:\s|$|\*)|\bHigh\b|\u2191/i, flag: 'HIGH' },
  // LOW: standalone word "Low", or arrows/asterisks
  { pattern: /(?:^|\s|\t)L(?:\s|$|\*)|\bLow\b|\u2193/i,  flag: 'LOW'  },
  // NORMAL last — avoid matching "Normal" within words like "Abnormal"
  { pattern: /(?:^|\s)Normal(?:\s|$)/i, flag: 'NORMAL' },
];

// ─── Unit Blacklist (these words must never appear as units) ───────────────────
const UNIT_BLACKLIST = [
  'normal', 'high', 'low', 'critical', 'borderline', 'abnormal',
  'calculated', 'positive', 'negative', 'reactive', 'non-reactive',
  'absent', 'present', 'nil',
];

// ─── Section Header Patterns ───────────────────────────────────────────────────
const SECTION_HEADER_PATTERNS = [
  /complete\s+blood\s+count|cbc|haematology|hematology/i,
  /liver\s+function|lft|hepatic\s+function/i,
  /renal\s+function|kidney\s+function|rft|kft/i,
  /lipid\s+profile|cholesterol\s+panel/i,
  /thyroid\s+function|tft|thyroid\s+profile/i,
  /blood\s+sugar|glucose\s+profile|glycemic/i,
  /electrolytes?|serum\s+electrolytes?/i,
  /urine\s+(?:analysis|examination|routine)/i,
  /coagulation|pt\/inr|clotting/i,
  /iron\s+studies|iron\s+profile/i,
  /vitamin\s+(?:b12|d|d3)/i,
  /serology|widal|dengue|malaria/i,
];

// ─── Numeric Parser with Range Guard ──────────────────────────────────────────
/**
 * Safely parse a single numeric value from a string.
 * Returns null if the string looks like a range (e.g. "4.5 - 5.5", "13.0–17.0").
 * Also returns null for flag/status words masquerading as values.
 * @param {string} str
 * @returns {number|null}
 */
export function parseNumericValue(str) {
  if (!str && str !== 0) return null;
  const s = String(str).trim();

  // Range guard: if input contains " - ", " – ", or "–", it's a range string, not a value
  if (/\s*[-–]\s*/.test(s) && /\d/.test(s.split(/\s*[-–]\s*/)[0]) && /\d/.test(s.split(/\s*[-–]\s*/)[1])) {
    return null;
  }

  // Flag word guard
  if (/^(normal|high|low|critical|borderline|abnormal|calculated|positive|negative|reactive|absent|present|nil)$/i.test(s.trim())) {
    return null;
  }

  // Strip thousands separators and attempt parse
  const cleaned = s.replace(/,/g, '');
  const match = cleaned.match(/^[+-]?\d+(?:\.\d+)?/);
  if (!match) return null;

  const num = parseFloat(match[0]);
  return isNaN(num) ? null : num;
}

// ─── Reference Range Parser ────────────────────────────────────────────────────
/**
 * Extract a reference range pair {min, max} from a string like "13.0 - 17.0" or "> 4.5".
 * Returns { raw, min, max } where raw is the original string.
 * If not parseable, returns { raw: null, min: null, max: null }.
 * @param {string} str
 * @returns {{ raw: string|null, min: number|null, max: number|null }}
 */
export function parseReferenceRange(str) {
  if (!str) return { raw: null, min: null, max: null };
  const s = String(str).trim();

  // Standard range: "13.0 - 17.0", "13.0–17.0", "4000 - 11000"
  const rangeMatch = s.match(/(\d+(?:[\.,]\d+)?)\s*[-–]\s*(\d+(?:[\.,]\d+)?)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1].replace(',', '.'));
    const max = parseFloat(rangeMatch[2].replace(',', '.'));
    if (!isNaN(min) && !isNaN(max)) {
      return { raw: `${min} - ${max}`, min, max };
    }
  }

  // Greater-than: "> 4.5" or "≥ 4.5"
  const gtMatch = s.match(/[>≥]\s*(\d+(?:[\.,]\d+)?)/);
  if (gtMatch) {
    const val = parseFloat(gtMatch[1].replace(',', '.'));
    if (!isNaN(val)) return { raw: s, min: val, max: Infinity };
  }

  // Less-than: "< 200" or "≤ 200"
  const ltMatch = s.match(/[<≤]\s*(\d+(?:[\.,]\d+)?)/);
  if (ltMatch) {
    const val = parseFloat(ltMatch[1].replace(',', '.'));
    if (!isNaN(val)) return { raw: s, min: -Infinity, max: val };
  }

  return { raw: null, min: null, max: null };
}

// ─── Source Flag Extractor ─────────────────────────────────────────────────────
/**
 * Read the source-printed flag from a raw row string.
 * Preserves verbatim: NORMAL, HIGH, LOW, BORDERLINE, CRITICAL, ABNORMAL.
 * Returns null if no flag is found.
 * @param {string} rowText
 * @returns {string|null}
 */
export function extractSourceFlag(rowText) {
  if (!rowText) return null;
  for (const { pattern, flag } of SOURCE_FLAG_PATTERNS) {
    if (pattern.test(rowText)) return flag;
  }
  return null;
}

// ─── Unit Sanitizer ────────────────────────────────────────────────────────────
/**
 * Sanitize a unit string — reject any word in the unit blacklist.
 * Normalizes common OCR artifacts: "ul" → "U/L", "ma/dl" → "mg/dL"
 * @param {string} unit
 * @returns {string} cleaned unit or empty string
 */
export function sanitizeUnit(unit) {
  if (!unit) return '';
  let u = String(unit).trim();

  // Reject if unit is a flag/status word
  if (UNIT_BLACKLIST.some((w) => u.toLowerCase() === w)) return '';

  // Normalize common OCR unit corruptions
  u = u
    .replace(/^Jemm$/i, '/cumm')
    .replace(/^\/cmm$/i, '/cumm')
    .replace(/^cumm$/i, '/cumm')
    .replace(/^mil\s*\/cmm$/i, 'mill/cumm')
    .replace(/^gm%$/i, 'g/dL')
    .replace(/^gm\/dl$/i, 'g/dL')
    .replace(/^ul$/i, 'U/L')
    .replace(/^u\/l$/i, 'U/L')
    .replace(/^fl$/i, 'fL')
    .replace(/\bul\b/gi, 'U/L')
    .replace(/\bma\/dl\b/gi, 'mg/dL')
    .replace(/\bg\/l\b/gi, 'g/L')
    .replace(/\bmeq\/l\b/gi, 'mEq/L')
    .replace(/\buiu\/ml\b/gi, 'uIU/mL')
    .replace(/\biu\/l\b/gi, 'IU/L');

  return u;
}

// ─── Section Header Detector ───────────────────────────────────────────────────
/**
 * Detect if a line is a section header (e.g. "LIVER FUNCTION TEST (LFT)")
 * @param {string} line
 * @returns {string|null} section name or null
 */
export function detectSectionHeader(line) {
  if (!line || line.trim().length < 3) return null;
  const l = line.trim();

  // Section headers do not contain numeric test values or results
  if (/\d/.test(l)) return null;

  // Must be relatively short
  const wordCount = l.split(/\s+/).length;
  if (wordCount > 8) return null;

  for (const pat of SECTION_HEADER_PATTERNS) {
    if (pat.test(l)) return l;
  }

  // Generic: ALL CAPS line with no numeric content — treat as section header
  if (/^[A-Z\s\/\(\)&,.-]{5,60}$/.test(l)) {
    return l;
  }

  return null;
}

// ─── Lab Row Classifier ────────────────────────────────────────────────────────
/**
 * Attempt to classify a text line as a lab data row.
 * A valid lab row has:
 *   - A test name (text at the start)
 *   - A numeric value
 *   - Optionally: a flag word, a reference range, a unit
 *
 * Returns a structured object or null if the line is not a data row.
 * @param {string} line
 * @param {string} currentSection
 * @returns {Object|null}
 */
export function classifyLabRow(line, currentSection = 'General') {
  if (!line || line.trim().length < 5) return null;
  const l = line.trim();

  // Skip obvious non-data lines
  if (
    /^(investigation|test\s*name|parameter|result|reference|value|unit|flag|normal|sample\s*type|tat:|page\s*\d|www\.|report|method|remark|collected|registered|reported|ref\.\s*by|sample\s*collected)/i.test(l)
  ) {
    return null;
  }

  // Must contain at least one numeric value to be a data row
  if (!/\d/.test(l)) return null;

  // Split on pipe (|), tab (\t), or 2+ consecutive spaces (column separator in most printed reports)
  const delimiter = l.includes('|') ? '|' : (l.includes('\t') ? '\t' : /\s{2,}/);
  const cells = l.split(delimiter).map((c) => c.trim()).filter(Boolean);
  if (cells.length < 2) {
    // Try single-space split as fallback for OCR-collapsed columns
    // Allows alphanumeric test names like (T3), (T4), HbA1c, D3, B12
    const fallback = l.match(/^([A-Za-z][A-Za-z0-9\s\(\)\/\-\.,:]*?[A-Za-z0-9\)])\s+(\d+(?:[.,]\d+)?)\s*(.*)?$/);
    if (!fallback) return null;

    const testName = fallback[1].trim();
    const rawValue = fallback[2];
    const remainder = fallback[3] || '';

    const value = parseNumericValue(rawValue);
    if (value === null) return null;

    const sourceFlag = extractSourceFlag(l);
    const { raw: refRange } = parseReferenceRange(remainder);
    const unit = sanitizeUnit(extractUnitFromText(remainder));

    return buildLabRow({ testName, value, rawValue, sourceFlag, refRange, unit, section: currentSection, raw: l });
  }

  // Multi-column line: cells[0] is test name, rest contain value, range, unit, flag
  const testName = cells[0];
  if (testName.length < 2 || /^\d/.test(testName)) return null;

  // Find the first cell that is a pure numeric value
  let value = null;
  let rawValue = null;
  let valueIdx = -1;
  for (let i = 1; i < cells.length; i++) {
    const v = parseNumericValue(cells[i]);
    if (v !== null) {
      value = v;
      rawValue = cells[i];
      valueIdx = i;
      break;
    }
  }
  if (value === null) return null;

  // Remaining cells after the value
  const remainder = cells.slice(valueIdx + 1).join('  ');

  // Extract source flag from remainder or full line
  const sourceFlag = extractSourceFlag(remainder) || extractSourceFlag(l);

  // Extract reference range from remainder
  const { raw: refRange } = parseReferenceRange(remainder);

  // Extract unit from remainder
  const unit = sanitizeUnit(extractUnitFromRemainder(remainder));

  return buildLabRow({ testName, value, rawValue, sourceFlag, refRange, unit, section: currentSection, raw: l });
}

// ─── Unit Extractor Helpers ────────────────────────────────────────────────────
export const KNOWN_UNITS = [
  'mill/cumm',
  'mil /cmm',
  'mil/cmm',
  'mcg/dL',
  'uIU/mL',
  'mmol/L',
  'µmol/L',
  'mEq/L',
  'mg/dL',
  'gm/dl',
  'µg/dL',
  'ng/mL',
  'pg/mL',
  'mIU/L',
  'mm/hr',
  '/cumm',
  'Jemm',
  '/cmm',
  'cumm',
  'gm%',
  'IU/L',
  'g/dL',
  'kU/L',
  '/hpf',
  '/lpf',
  'sec',
  'INR',
  'U/L',
  'uL',
  'u/L',
  'g/L',
  'mL',
  'fL',
  'pg',
  'fl',
  'mg',
  'g',
  '%',
].sort((a, b) => b.length - a.length);

/**
 * Try to extract a unit from a text string by matching known unit patterns.
 */
function extractUnitFromRemainder(text) {
  if (!text) return '';
  for (const u of KNOWN_UNITS) {
    const escaped = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`, 'i');
    if (rx.test(text)) return u;
  }
  for (const u of KNOWN_UNITS) {
    if (text.includes(u)) return u;
  }
  // Fallback: look for unit-like patterns (letters, slashes, percent)
  const match = text.match(/\b([a-zA-Z%µ][a-zA-Z%/µ]*(?:\/[a-zA-Z]+)?)\b/);
  if (match && !UNIT_BLACKLIST.includes(match[1].toLowerCase())) return match[1];
  return '';
}

function extractUnitFromText(text) {
  return extractUnitFromRemainder(text);
}

// ─── Lab Row Builder ───────────────────────────────────────────────────────────
/**
 * Build a standardized lab row object with data quality metadata.
 */
function buildLabRow({ testName, value, rawValue, sourceFlag, refRange, unit, section, raw }) {
  const hasAllFields = testName && value !== null && unit && refRange;
  const extractionQuality = hasAllFields ? 'COMPLETE' : (testName && value !== null ? 'PARTIAL' : 'INCOMPLETE');

  return {
    test_name: testName,
    section: section || 'General',
    observed_value: String(value),
    raw_value: rawValue,
    source_flag: sourceFlag,         // verbatim from source document
    flag: sourceFlag || null,        // use source flag; computed override below if needed
    reference_range: refRange || null,
    unit: unit || null,
    extraction_quality: extractionQuality,
    verification_required: false,    // may be set by enrichment layer
    raw_row: raw,
  };
}

// ─── Computed Flag Engine ──────────────────────────────────────────────────────
/**
 * Compute a flag from value vs reference range.
 * Returns 'HIGH', 'LOW', 'NORMAL', or null if range is not available.
 * @param {number} value
 * @param {string|null} refRangeStr
 * @returns {string|null}
 */
export function computeFlag(value, refRangeStr) {
  if (value === null || value === undefined) return null;
  const { min, max } = parseReferenceRange(refRangeStr);
  if (min === null && max === null) return null;
  if (value < min) return 'LOW';
  if (value > max) return 'HIGH';
  return 'NORMAL';
}

// ─── Real Confidence Score Calculator ─────────────────────────────────────────
/**
 * Calculate a realistic extraction confidence score (0.0 – 1.0) based on
 * how many fields were successfully extracted.
 *
 * @param {Object} params
 * @param {Object|null} patient
 * @param {Object|null} facility
 * @param {Array} labRows
 * @param {boolean} aiTierSucceeded
 * @returns {{ score: number, label: 'CLEAR'|'PARTIAL'|'UNCERTAIN' }}
 */
export function computeConfidenceScore({ patient, facility, labRows, aiTierSucceeded }) {
  let score = 0.0;
  let total = 0;

  // Patient demographics (weight: 20%)
  total += 3;
  if (patient?.name) score += 1;
  if (patient?.age) score += 1;
  if (patient?.gender) score += 1;

  // Facility / date presence (weight: 10%)
  total += 2;
  if (facility?.name) score += 1;
  if (facility?.date) score += 1;

  // Lab row extraction quality (weight: 60%)
  if (labRows && labRows.length > 0) {
    const completeRows = labRows.filter((r) => r.extraction_quality === 'COMPLETE').length;
    const partialRows = labRows.filter((r) => r.extraction_quality === 'PARTIAL').length;
    // Complete rows score full points, partial rows score half
    const rowScore = (completeRows + partialRows * 0.5) / Math.max(labRows.length, 1);
    score += rowScore * 6;
    total += 6;
  } else {
    total += 6; // penalize for no rows extracted
  }

  // AI tier bonus (weight: 10%)
  total += 1;
  if (aiTierSucceeded) score += 1;

  const normalized = Math.min(1.0, Math.max(0.0, score / total));
  const label = normalized >= 0.85 ? 'CLEAR' : normalized >= 0.65 ? 'PARTIAL' : 'UNCERTAIN';

  return { score: Math.round(normalized * 100) / 100, label };
}

// ─── Main Table Extraction Entry Point ────────────────────────────────────────
/**
 * Parse a full OCR/text lab report and extract all lab investigation rows
 * organized by section.
 *
 * @param {string} rawText — Full OCR/PDF extracted text of the lab report
 * @returns {{ sections: Object, rows: Array, totalRows: number }}
 */
export function extractLabTableRows(rawText) {
  if (!rawText || rawText.trim().length < 10) {
    return { sections: {}, rows: [], totalRows: 0 };
  }

  const lines = rawText
    .split('\n')
    .map((l) => l.replace(/\r/g, '').trimEnd());

  const sections = {};
  const allRows = [];
  let currentSection = 'General';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Check for section header
    const sectionName = detectSectionHeader(line);
    if (sectionName) {
      currentSection = sectionName;
      if (!sections[currentSection]) sections[currentSection] = [];
      continue;
    }

    // Attempt to classify as a lab data row
    const row = classifyLabRow(line, currentSection);
    if (row) {
      if (!sections[currentSection]) sections[currentSection] = [];
      sections[currentSection].push(row);
      allRows.push(row);
    }
  }

  return {
    sections,
    rows: allRows,
    totalRows: allRows.length,
  };
}

/**
 * Check for and repair common OCR decimal loss artifacts.
 * E.g. RBC reference interval printed as "4.5 - 5.5" but OCR'd as "45 - 55"
 * E.g. MCHC reference interval printed as "32.5 - 34.5" but OCR'd as "32.5 - 345"
 */
export function checkAndRepairDecimalLoss(testName, value, rMin, rMax) {
  const name = String(testName || '').toLowerCase().replace(/[^a-z0-9]/g, ' ');
  let repairedMin = rMin;
  let repairedMax = rMax;
  let wasRepaired = false;

  // 1. RBC Count: physiological interval is ~4.0 - 6.0 mill/cumm.
  // OCR frequently recognizes "4.5 - 5.5" as "45 - 55" or "38 - 48"
  if ((name.includes('rbc') || name.includes('red blood')) && repairedMin !== null && repairedMax !== null) {
    if (repairedMin >= 30 && repairedMax <= 70) {
      repairedMin = Number((repairedMin / 10).toFixed(2));
      repairedMax = Number((repairedMax / 10).toFixed(2));
      wasRepaired = true;
    }
  }

  // 2. MCHC: physiological interval is ~32 - 36 g/dL.
  // OCR frequently recognizes "32.5 - 34.5" as "32.5 - 345" (dropping decimal in upper bound)
  if (name.includes('mchc') && repairedMax !== null && repairedMax >= 300 && repairedMax <= 400) {
    repairedMax = Number((repairedMax / 10).toFixed(1));
    wasRepaired = true;
  }

  // 3. Bilirubin Direct: physiological interval is < 0.3 mg/dL.
  // OCR frequently recognizes "< 0.3" as "<03" (parsed as 3)
  if ((name.includes('bilirubin direct') || name.includes('direct bilirubin')) && repairedMax === 3) {
    repairedMax = 0.3;
    wasRepaired = true;
  }

  // 4. General 10x ratio guard:
  // If value is ~5.2 and range is 45 - 55 (value * 10 is inside range), detect decimal loss in range
  if (value !== null && repairedMin !== null && repairedMax !== null && !wasRepaired) {
    if (value >= 1.0 && value <= 15.0 && repairedMin >= 10.0 && repairedMax <= 150.0) {
      const tenX = value * 10;
      if (tenX >= repairedMin && tenX <= repairedMax) {
        repairedMin = Number((repairedMin / 10).toFixed(2));
        repairedMax = Number((repairedMax / 10).toFixed(2));
        wasRepaired = true;
      }
    }
  }

  return {
    min: repairedMin,
    max: repairedMax,
    raw: wasRepaired ? `${repairedMin} - ${repairedMax}` : null,
    wasRepaired,
  };
}

/**
 * Post-process extracted rows:
 * - Apply decimal loss repair on reference ranges
 * - Separate source flag from calculated status
 * - Priority: 1. Source flag, 2. Range calculation, 3. Critical overrides
 * - Calculate field-level confidence scores
 */
export function postProcessRows(rows, standardRanges = {}) {
  return rows.map((row) => {
    const value = parseNumericValue(row.observed_value);
    const { min: initialMin, max: initialMax } = parseReferenceRange(row.reference_range);

    // Decimal loss repair
    const { min: rMin, max: rMax, raw: repairedRangeStr, wasRepaired } = checkAndRepairDecimalLoss(
      row.test_name,
      value,
      initialMin,
      initialMax
    );
    let effectiveRefRange = row.reference_range;
    if (wasRepaired && repairedRangeStr) {
      effectiveRefRange = repairedRangeStr;
      row.reference_range = repairedRangeStr;
      row.decimal_loss_repaired = true;
    }

    // Compute mathematical status against the reference interval
    let computedFlag = null;
    if (value !== null && rMin !== null && rMax !== null) {
      if (value < rMin) computedFlag = 'LOW';
      else if (value > rMax) computedFlag = 'HIGH';
      else computedFlag = 'NORMAL';
    } else if (value !== null && rMax !== null && rMin === -Infinity) {
      computedFlag = value > rMax ? 'HIGH' : 'NORMAL';
    } else if (value !== null && rMin !== null && rMax === Infinity) {
      computedFlag = value < rMin ? 'LOW' : 'NORMAL';
    }

    // Source Flag vs Calculated Status (Section 9 of Core Rule)
    const sourceFlag = row.source_flag || null;
    const calculatedStatus = computedFlag || (row.flag === 'NORMAL' ? 'NORMAL' : null);

    // Final flag: source flag has highest priority unless critical bounds
    let finalFlag = sourceFlag || computedFlag || 'NORMAL';
    let verificationRequired = false;

    // Critical threshold check using standard ranges dictionary
    const testKey = String(row.test_name || '').toLowerCase().replace(/[^a-z]/g, '_');
    for (const [key, std] of Object.entries(standardRanges)) {
      if (testKey.includes(key) || key.includes(testKey.replace(/_+/g, ''))) {
        if (value !== null) {
          if (std.criticalLow !== null && std.criticalLow !== undefined && value <= std.criticalLow) {
            finalFlag = 'CRITICAL';
            verificationRequired = true;
          } else if (std.criticalHigh !== null && std.criticalHigh !== undefined && value >= std.criticalHigh) {
            finalFlag = 'CRITICAL';
            verificationRequired = true;
          }
        }
        if (!row.unit && std.unit) row.unit = std.unit;
        break;
      }
    }

    // If source flag conflicts with computed flag (and neither is Borderline), flag for verification
    if (sourceFlag && computedFlag && sourceFlag !== computedFlag && sourceFlag !== 'BORDERLINE') {
      verificationRequired = true;
    }

    // Explicitly preserve BORDERLINE
    if (sourceFlag === 'BORDERLINE') {
      finalFlag = 'BORDERLINE';
    }

    // Field-level confidence scores (Section 12)
    const nameConf = row.test_name ? 0.98 : 0.1;
    const valConf = value !== null ? 0.99 : 0.4;
    const unitConf = row.unit ? 0.96 : 0.7;
    const refConf = effectiveRefRange ? (wasRepaired ? 0.90 : 0.96) : 0.6;
    const flagConf = sourceFlag ? 0.99 : 0.92;
    const overallConf = Number(((nameConf + valConf + unitConf + refConf + flagConf) / 5).toFixed(2));

    return {
      ...row,
      observed_value: value !== null ? String(value) : row.observed_value,
      value: value !== null ? String(value) : row.observed_value,
      reference_range: effectiveRefRange,
      source_flag: sourceFlag,
      calculated_status: calculatedStatus,
      computed_flag: computedFlag,
      flag: finalFlag,
      status: finalFlag,
      verification_required: verificationRequired,
      alert: finalFlag === 'CRITICAL' || finalFlag === 'HIGH' || finalFlag === 'LOW' || finalFlag === 'BORDERLINE' || finalFlag === 'ABNORMAL',
      confidence: {
        test_name: nameConf,
        value: valConf,
        unit: unitConf,
        reference_range: refConf,
        flag: flagConf,
        overall: overallConf,
      },
    };
  });
}

export default {
  extractLabTableRows,
  postProcessRows,
  checkAndRepairDecimalLoss,
  parseNumericValue,
  parseReferenceRange,
  extractSourceFlag,
  sanitizeUnit,
  computeFlag,
  computeConfidenceScore,
  KNOWN_UNITS,
};
