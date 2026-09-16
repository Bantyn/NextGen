import mongoose from 'mongoose';
import app from './src/app.js';
import { documentService } from './src/services/documentService.js';
import { doctorService } from './src/services/doctorService.js';
import MedicalDocument from './src/models/MedicalDocument.js';
import fs from 'fs';
import path from 'path';

const TEST_PORT = 5066;

async function runTestSuite() {
  console.log('🧪 ========================================================');
  console.log('🧪 SEHAT — DOCUMENT INTELLIGENCE & OPD TEST SUITE');
  console.log('🧪 ========================================================\n');

  const server = app.listen(TEST_PORT, '127.0.0.1');

  let retries = 10;
  while (mongoose.connection.readyState !== 1 && retries > 0) {
    console.log('Waiting for MongoDB connection...');
    await new Promise((r) => setTimeout(r, 500));
    retries--;
  }

  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      failed++;
      throw new Error(message);
    } else {
      console.log(`✅ PASS: ${message}`);
      passed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Doctor Routing for All 6 AYUSH Disciplines vs General OPD
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Doctor Matching & Discipline Routing ---');

    const ayushSystems = [
      { system: 'AYURVEDA', expectedName: 'Dr. Harish Vyas', expectedDegree: 'BAMS, MD (Ayurveda - Kayachikitsa)' },
      { system: 'YOGA_NATUROPATHY', expectedName: 'Dr. Aarav Mehta', expectedDegree: 'BNYS (Naturopathy & Yogic Sciences)' },
      { system: 'UNANI', expectedName: 'Dr. Tariq Hakim', expectedDegree: 'BUMS, MD (Unani Medicine)' },
      { system: 'SIDDHA', expectedName: 'Dr. S. Murugan', expectedDegree: 'BSMS, MD (Siddha Maruthuvam)' },
      { system: 'HOMOEOPATHY', expectedName: 'Dr. Rohini Sen', expectedDegree: 'BHMS, MD (Homoeopathy)' },
      { system: 'SOWA_RIGPA', expectedName: 'Dr. Tenzin Norbu', expectedDegree: 'Menrampa (MD Sowa-Rigpa)' },
    ];

    for (const sys of ayushSystems) {
      const doctors = await doctorService.findAndRankDoctors({
        consultationType: 'AYUSH',
        opdType: 'AYUSH',
        opdSystem: sys.system,
      });

      assert(doctors.length > 0, `Found doctor for AYUSH system: ${sys.system}`);
      assert(
        doctors[0].doctor_name === sys.expectedName,
        `Routing correctly matched ${sys.system} to ${sys.expectedName} (Got: ${doctors[0].doctor_name})`
      );
      assert(
        doctors[0].qualification === sys.expectedDegree,
        `Doctor degree verified: ${doctors[0].qualification}`
      );
    }

    // Modern / General OPD routing
    const generalDoctors = await doctorService.findAndRankDoctors({
      consultationType: 'GENERAL',
      opdType: 'GENERAL',
      opdSystem: 'MODERN_MEDICINE',
      medicalSpecialization: 'General Medicine',
    });
    assert(generalDoctors.length > 0, 'Found modern medicine doctor for General OPD');
    assert(
      generalDoctors[0].qualification.includes('MBBS') || generalDoctors[0].qualification.includes('MD'),
      `General OPD doctor has modern qualification: ${generalDoctors[0].qualification}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Clinical NLP Extraction, Abnormal Range Detection & Dual Summaries
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Clinical Document Extraction & Dual Summaries ---');

    const sampleLabReportText = `
PATIENT NAME: Ramesh Patel
AGE: 48    GENDER: Male
DATE OF REPORT: 12 September 2026
FACILITY: Apex Healthcare Diagnostics
ORDERED BY: Dr. Rajesh Mehta, MD

CHIEF COMPLAINTS: Fatigue, generalized weakness, mild chest discomfort on exertion.
DIAGNOSES: Suspected Microcytic Anemia, Borderline Hyperglycemia.
PREVIOUS MEDICAL HISTORY: Previous cardiac history with hypertension.
CURRENT MEDICATIONS: Tab Metformin 500mg BD, Tab Amlodipine 5mg OD.

LABORATORY INVESTIGATION RESULTS:
Test Name              Observed Value    Unit       Reference Range
Hemoglobin             9.8               g/dL       13.0 - 17.0
Fasting Blood Sugar    142               mg/dL      70 - 99
Platelet Count         220000            /cumm      150000 - 450000
Serum Creatinine       0.9               mg/dL      0.7 - 1.3
Total Cholesterol      245               mg/dL      125 - 200
HbA1c                  7.2               %          4.0 - 5.6
`;

    // Write temporary text file for testing
    const tempFilePath = path.join(process.cwd(), 'uploads', `test-report-${Date.now()}.txt`);
    fs.writeFileSync(tempFilePath, sampleLabReportText);

    const extractionResult = documentService.extractClinicalDataIntelligently(
      sampleLabReportText,
      'LAB_REPORT',
      'test_report.txt'
    );

    assert(extractionResult !== null, 'Structured clinical data extracted');
    assert(extractionResult.patient.name === 'Ramesh Patel', 'Patient name extracted: Ramesh Patel');
    assert(extractionResult.patient.age === '48', 'Patient age extracted: 48');
    assert(extractionResult.patient.gender === 'Male', 'Patient gender extracted: Male');

    // Check lab results
    const labs = extractionResult.lab_investigations;
    assert(labs.length >= 4, `Identified ${labs.length} lab investigations`);

    const hb = labs.find((l) => l.test_name.toLowerCase().includes('hemoglobin'));
    assert(hb !== undefined, 'Hemoglobin parameter found');
    assert(String(hb.observed_value) === '9.8', `Hemoglobin value is 9.8 (Got: ${hb.observed_value})`);
    assert(hb.flag === 'LOW', `Hemoglobin flag is LOW (Got: ${hb.flag})`);

    const fbs = labs.find((l) => l.test_name.toLowerCase().includes('blood sugar'));
    assert(fbs !== undefined, 'Blood Sugar parameter found');
    assert(fbs.flag === 'HIGH', `Blood Sugar flag is HIGH (Got: ${fbs.flag})`);

    // Check Dual Summaries
    assert(extractionResult.clinical_summary !== null, 'Clinical Summary generated');
    assert(extractionResult.clinical_summary.physician_digest !== undefined, 'Physician digest generated');
    assert(extractionResult.patient_summary !== null, 'Patient-Friendly Summary generated');
    assert(extractionResult.patient_summary.about !== undefined, 'Patient "About" explanation generated');
    assert(extractionResult.patient_summary.meaning !== undefined, 'Patient "What this may mean" generated');
    assert(extractionResult.patient_summary.action !== undefined, 'Patient "What you should do" generated');
    assert(extractionResult.patient_summary.disclaimer !== undefined, 'Mandatory safety disclaimer present');

    // Check Important Findings
    assert(extractionResult.important_findings.length > 0, 'Important findings compiled');
    const lowHbFinding = extractionResult.important_findings.find((f) => f.finding.includes('Hemoglobin'));
    assert(lowHbFinding !== undefined, 'Low hemoglobin finding highlighted in key findings');

    // Clean up temp file
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    // -------------------------------------------------------------------------
    // TEST 3: Document API Endpoints (Upload, Get, Summary, File Stream)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Document API Endpoints ---');

    // Create a mock doc in DB to test API retrieval
    const testDoc = await MedicalDocument.create({
      patient_id: 'PAT-TEST-001',
      session_id: 'SES-TEST-001',
      file_name: 'test_clinical_panel.pdf',
      file_url: '/api/documents/test-doc-id/file',
      document_type: 'LAB_REPORT',
      file_size: 15420,
      mime_type: 'application/pdf',
      extracted_text: sampleLabReportText,
      extracted_data: extractionResult,
      clinical_summary: extractionResult.clinical_summary,
      patient_summary: extractionResult.patient_summary,
      important_findings: extractionResult.important_findings,
      extraction_confidence: 'CLEAR',
      confidence_score: 0.96,
      processing_status: 'COMPLETED',
    });

    assert(testDoc._id !== null, 'Document created in database');

    // GET /api/documents/:documentId
    const getDocRes = await fetch(`${baseUrl}/api/documents/${testDoc.document_id}`);
    const getDocData = await getDocRes.json();
    assert(getDocRes.status === 200, `GET /api/documents/:documentId status 200`);
    assert(getDocData.success === true, 'Document retrieval success is true');
    assert(getDocData.data.document_id === testDoc.document_id, 'Returned matching document_id');

    // GET /api/documents/:documentId/summary
    const getSummaryRes = await fetch(`${baseUrl}/api/documents/${testDoc.document_id}/summary`);
    const getSummaryData = await getSummaryRes.json();
    assert(getSummaryRes.status === 200, `GET /api/documents/:documentId/summary status 200`);
    assert(getSummaryData.data.patientSummary !== undefined, 'Returned patient summary');
    assert(getSummaryData.data.clinicalSummary !== undefined, 'Returned clinical summary');
    assert(getSummaryData.data.importantFindings.length > 0, 'Returned important findings');

    // Security Check: Invalid file upload rejection
    console.log('\n--- 4. Testing Security Validations ---');
    const invalidUploadRes = await fetch(`${baseUrl}/api/patient/documents`, {
      method: 'POST',
      body: new FormData(), // empty form data without file
    });
    const invalidUploadData = await invalidUploadRes.json();
    assert(invalidUploadRes.status === 400, 'Empty document upload rejected with 400 Bad Request');

    // Clean up test document
    await MedicalDocument.findByIdAndDelete(testDoc._id);

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
    console.log(`Summary: ${passed} passed, ${failed} failed.`);
  } catch (err) {
    console.error('\n❌ Test Suite Failed with Error:', err);
    failed++;
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTestSuite();
