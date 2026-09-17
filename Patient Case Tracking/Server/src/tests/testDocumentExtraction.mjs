/**
 * testDocumentExtraction.mjs
 * Phase 9 Verification Test — Medical Document AI Accuracy
 *
 * Run: node Server/src/tests/testDocumentExtraction.mjs
 */

import {
  extractLabTableRows,
  postProcessRows,
  parseNumericValue,
  parseReferenceRange,
  extractSourceFlag,
  sanitizeUnit,
  computeConfidenceScore,
} from '../utils/medicalTableParser.js';

const SAMPLE_LFT_OCR = `
DRLOGY PATHOLOGY LAB

Yashvi M. Patel
Age: 21 Years
Sex: Female
UHID : 556
Ref. By: Dr. Hiren Shah

LIVER FUNCTION TEST (LFT)

Investigation        Result  Reference Value  Unit

AST (SGOT)           35.00   Normal           15.00 - 40.00    U/L
ALT (SGPT)           35.00   Normal           10.00 - 49.00    U/L
AST: ALT Ratio       1.00    Normal           <1.00
Gamma GT             65.00   Normal           0.00 - 73.00     U/L
Alkaline Phosphatase (ALP)  45.00   Normal   30.00 - 120.00   U/L
Bilirubin Total      1.00    Normal           0.30 - 1.20      mg/dL
Bilirubin Direct     0.20    Normal           0.00 - 0.30      mg/dL
Bilirubin Indirect   0.80    Normal           0.20 - 1.10      mg/dL
Total Protein        7.20    Normal           5.70 - 8.20      g/dL
Albumin              4.10    Normal           3.20 - 4.80      g/dL
Globulin             3.10    Normal           2.00 - 3.50      g/dL
A:G Ratio            1.32    Normal           0.90 - 2.00
`;

const STANDARD_LAB_RANGES = {
  sgpt: { min: 10, max: 49, unit: 'U/L', criticalLow: null, criticalHigh: 300 },
  alt: { min: 10, max: 49, unit: 'U/L', criticalLow: null, criticalHigh: 300 },
  sgot: { min: 15, max: 40, unit: 'U/L', criticalLow: null, criticalHigh: 300 },
  ast: { min: 15, max: 40, unit: 'U/L', criticalLow: null, criticalHigh: 300 },
  ggt: { min: 0, max: 73, unit: 'U/L', criticalLow: null, criticalHigh: 250 },
  alp: { min: 30, max: 120, unit: 'U/L', criticalLow: null, criticalHigh: 350 },
  total_bilirubin: { min: 0.3, max: 1.2, unit: 'mg/dL', criticalLow: null, criticalHigh: 10.0 },
  total_protein: { min: 5.7, max: 8.2, unit: 'g/dL', criticalLow: 4.5, criticalHigh: null },
  albumin: { min: 3.2, max: 4.8, unit: 'g/dL', criticalLow: 2.5, criticalHigh: null },
};

let passed = 0;
let failed = 0;
const failures = [];

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  \u2705 PASS: ${label}`);
    passed++;
  } else {
    console.error(`  \u274c FAIL: ${label}${detail ? ` \u2014 ${detail}` : ''}`);
    failed++;
    failures.push({ label, detail });
  }
}

console.log('\n=== Phase 9 \u2014 Medical Document Extraction Accuracy Test ===\n');

// 1. parseNumericValue
console.log('1. parseNumericValue Range Guard');
assert('Single "35.00"', parseNumericValue('35.00') === 35.0);
assert('Single "1.00"', parseNumericValue('1.00') === 1.0);
assert('Range "4.5 - 5.5" -> null', parseNumericValue('4.5 - 5.5') === null, `got ${parseNumericValue('4.5 - 5.5')}`);
assert('Range "13.0-17.0" -> null', parseNumericValue('13.0-17.0') === null, `got ${parseNumericValue('13.0-17.0')}`);
assert('Flag "Normal" -> null', parseNumericValue('Normal') === null);
assert('Flag "High" -> null', parseNumericValue('High') === null);

// 2. sanitizeUnit
console.log('\n2. sanitizeUnit Contamination');
assert('"Normal" rejected', sanitizeUnit('Normal') === '', `got "${sanitizeUnit('Normal')}"`);
assert('"High" rejected', sanitizeUnit('High') === '', `got "${sanitizeUnit('High')}"`);
assert('"Calculated" rejected', sanitizeUnit('Calculated') === '', `got "${sanitizeUnit('Calculated')}"`);
assert('"U/L" preserved', sanitizeUnit('U/L') === 'U/L', `got "${sanitizeUnit('U/L')}"`);
assert('"mg/dL" preserved', sanitizeUnit('mg/dL') === 'mg/dL', `got "${sanitizeUnit('mg/dL')}"`);

// 3. extractSourceFlag
console.log('\n3. Source Flag Extraction');
assert('"Normal" row -> NORMAL', extractSourceFlag('35.00  Normal  15.00 - 40.00  U/L') === 'NORMAL');
assert('"Borderline" row -> BORDERLINE', extractSourceFlag('5.0  Borderline  4.5 - 5.5') === 'BORDERLINE');
assert('"High" row -> HIGH', extractSourceFlag('200  High  50 - 150  mg/dL') === 'HIGH');
assert('"Low" row -> LOW', extractSourceFlag('2.5  Low  3.5 - 5.1') === 'LOW');

// 4. parseReferenceRange
console.log('\n4. parseReferenceRange');
const r1 = parseReferenceRange('15.00 - 40.00');
assert('min=15', r1.min === 15.0, `got ${r1.min}`);
assert('max=40', r1.max === 40.0, `got ${r1.max}`);
const r2 = parseReferenceRange('0.30-1.20');
assert('min=0.3', r2.min === 0.3, `got ${r2.min}`);
assert('max=1.2', r2.max === 1.2, `got ${r2.max}`);

// 5. Universal table parser
console.log('\n5. Universal Table Parser \u2014 LFT Report');
const { rows: rawRows, totalRows } = extractLabTableRows(SAMPLE_LFT_OCR);
const labRows = postProcessRows(rawRows, STANDARD_LAB_RANGES);
console.log(`   -> Total raw rows: ${totalRows}, post-processed: ${labRows.length}`);
console.log('   Rows extracted:');
labRows.forEach((r) => console.log(`     ${r.test_name}: ${r.observed_value} ${r.unit} | flag=${r.flag} | range=${r.reference_range}`));

assert('At least 6 parameters', labRows.length >= 6, `got ${labRows.length}`);

const astRow = labRows.find((r) => /sgot|ast/i.test(r.test_name));
const altRow = labRows.find((r) => /sgpt|alt\b/i.test(r.test_name));
const bilRow = labRows.find((r) => /bilirubin\s+total|total\s+bilirubin/i.test(r.test_name));
const alpRow = labRows.find((r) => /alkaline\s+phosphatase|alp\b/i.test(r.test_name));

if (astRow) {
  assert('AST value=35', parseNumericValue(astRow.observed_value) === 35, `got ${astRow.observed_value}`);
  assert('AST unit=U/L', String(astRow.unit).includes('U/L'), `got "${astRow.unit}"`);
  assert('AST flag=NORMAL', astRow.flag === 'NORMAL', `got "${astRow.flag}"`);
  assert('AST unit not "Normal"', !/^normal$/i.test(String(astRow.unit)), `got "${astRow.unit}"`);
} else { assert('AST row found', false, 'not extracted'); }

if (altRow) {
  assert('ALT value=35', parseNumericValue(altRow.observed_value) === 35, `got ${altRow.observed_value}`);
  assert('ALT unit=U/L', String(altRow.unit).includes('U/L'), `got "${altRow.unit}"`);
  assert('ALT flag=NORMAL', altRow.flag === 'NORMAL', `got "${altRow.flag}"`);
} else { assert('ALT row found', false, 'not extracted'); }

if (bilRow) {
  assert('Bilirubin Total value=1', parseNumericValue(bilRow.observed_value) === 1.0, `got ${bilRow.observed_value}`);
  assert('Bilirubin unit=mg/dL', String(bilRow.unit).includes('mg/dL'), `got "${bilRow.unit}"`);
  assert('Bilirubin flag=NORMAL', bilRow.flag === 'NORMAL', `got "${bilRow.flag}"`);
} else { assert('Bilirubin Total row found', false, 'not extracted'); }

if (alpRow) {
  assert('ALP value=45', parseNumericValue(alpRow.observed_value) === 45, `got ${alpRow.observed_value}`);
  assert('ALP flag=NORMAL', alpRow.flag === 'NORMAL', `got "${alpRow.flag}"`);
}

// 6. No unit contamination
console.log('\n6. Unit Contamination Check');
const badUnits = labRows.filter((r) => r.unit && /^(normal|high|low|borderline|critical|calculated)$/i.test(r.unit.trim()));
assert(`0 rows with flag words as unit`, badUnits.length === 0, badUnits.map((r) => `${r.test_name}="${r.unit}"`).join(', '));

// 7. Real confidence
console.log('\n7. Confidence Score');
const { score, label } = computeConfidenceScore({
  patient: { name: 'Yashvi M. Patel', age: '21', gender: 'Female' },
  facility: { name: 'Drlogy', date: '02 Dec' },
  labRows,
  aiTierSucceeded: false,
});
console.log(`   -> score=${score} label=${label}`);
assert('score > 0.5', score > 0.5, `got ${score}`);
assert('score != hardcoded 0.94', score !== 0.94, `got ${score}`);
assert('label PARTIAL or CLEAR', label === 'PARTIAL' || label === 'CLEAR', `got "${label}"`);

// Summary
console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('Failures:');
  failures.forEach((f) => console.log(`  - ${f.label}: ${f.detail}`));
}
console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n');
if (failed > 0) process.exit(1);
