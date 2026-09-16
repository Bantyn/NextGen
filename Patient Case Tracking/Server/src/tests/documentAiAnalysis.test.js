import mongoose from 'mongoose';
import { connectDB } from '../utils/db.js';
import { documentService } from '../services/documentService.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { MedicalDocument } from '../models/MedicalDocument.js';
import { ClinicalSession } from '../models/ClinicalSession.js';
import { ClinicalObservation } from '../models/ClinicalObservation.js';

async function runDocumentAiTests() {
  console.log('========================================================================');
  console.log('🔬 SEHAT CLINICAL AI — DOCUMENT TEXT EXTRACTION & INTELLIGENCE TEST SUITE');
  console.log('========================================================================\n');

  await connectDB();

  const TEST_PATIENT_ID = 'PAT-AI-DOC-001';
  const TEST_SESSION_ID = 'SES-AI-DOC-001';

  try {
    // 0. Clean prior test records
    await MedicalDocument.deleteMany({ patient_id: TEST_PATIENT_ID });
    await ClinicalSession.deleteMany({ session_id: TEST_SESSION_ID });
    await ClinicalObservation.deleteMany({ session_id: TEST_SESSION_ID });

    // Create active ClinicalSession for testing intelligence sync
    await ClinicalSession.create({
      session_id: TEST_SESSION_ID,
      patient_id: TEST_PATIENT_ID,
      language: 'en-IN',
      status: 'IN_PROGRESS',
      journey_stage: 'CHECKED_IN',
      clinical_state: {
        chief_complaint: 'Generalized Fatigue',
        symptoms: ['Fatigue'],
        medications: [],
        allergies: [],
        relevant_history: [],
      },
    });

    console.log('✅ Setup: Test clinical session registered.\n');

    // Sample real-world medical document extracted text
    const sampleExtractedText = `
APOLLO DIAGNOSTICS & RESEARCH CENTRE
124 Healthcare Boulevard, City Centre
Phone: +91 22 8765 4321 | Email: reports@apollodiagnostics.org

PATIENT INVESTIGATION REPORT
Patient Name: Mrs. Sunita Rao       Age: 46 Years     Gender: Female
Patient ID / UHID: AP-2026-98124    Sample Date: 14/09/2026
Referred By: Dr. K. S. Murthy (MD, Internal Medicine)
Department: Clinical Pathology & Biochemistry

CHIEF COMPLAINTS & REASON FOR INVESTIGATION:
Severe fatigue, dizziness upon standing, and unexplained lethargy for 2 weeks.

RELEVANT MEDICAL HISTORY:
Known patient of Type 2 Diabetes Mellitus since 5 years on oral hypoglycemics. Mild Hypertension.

HAEMATOLOGY & BIOCHEMISTRY PROFILE:
Test Description              Observed Value    Units        Reference Interval    Flag
-----------------------------------------------------------------------------------------
Hemoglobin (Hb)               6.8               g/dL         12.0 - 15.5           CRITICAL LOW
Total Leukocyte Count (WBC)   12,500            /cumm        4000 - 11000          HIGH
Platelet Count                210,000           /cumm        150000 - 450000       NORMAL
Fasting Blood Sugar (FBS)     245               mg/dL        70 - 100              HIGH
HbA1c Glycated Hemoglobin     9.4               %            4.0 - 5.6             HIGH
Serum Creatinine              1.7               mg/dL        0.6 - 1.2             HIGH
Blood Urea                    52                mg/dL        15 - 40               HIGH

CURRENT / PRESCRIBED MEDICATIONS:
Tab Metformin 500mg BD after meals for 30 days
Tab Iron Folic Acid 100mg OD with food for 60 days
Tab Telmisartan 40mg OD morning

DOCUMENTED ALLERGIES:
Penicillin Hypersensitivity (skin urticaria)

PROVISIONAL DIAGNOSIS & IMPRESSION:
1. Decompensated Type 2 Diabetes Mellitus with Poor Glycemic Control (HbA1c 9.4%)
2. Severe Microcytic Hypochromic Anemia (Hb 6.8 g/dL) - Urgent Evaluation Required
3. Mild Diabetic Nephropathy / Azotemia (Elevated Creatinine & Blood Urea)

ADVICE / FOLLOW UP:
Urgent consultation with attending physician Dr. K. S. Murthy. Evaluate for sources of occult blood loss.
Dietary counseling for glycemic control.
`;

    // ========================================================================
    // TEST 1: Multi-Tier AI Clinical Analysis of Extracted Text
    // ========================================================================
    console.log('--- TEST 1: AI Clinical Reasoning on Extracted Medical Text ---');
    const analysis = await documentService.analyzeExtractedTextWithAI(
      sampleExtractedText,
      'LAB_REPORT',
      'sunita_rao_lab_report.pdf'
    );

    if (!analysis) {
      throw new Error('AI document analysis returned null or empty result');
    }

    console.log(`   Document Title: "${analysis.document_title}"`);
    console.log(`   Document Type: ${analysis.document_type}`);
    console.log(`   Patient Name: ${analysis.patient?.name}, Age: ${analysis.patient?.age}, Gender: ${analysis.patient?.gender}`);
    console.log(`   Doctor: ${analysis.doctor?.name}, Facility: ${analysis.doctor?.facility}`);
    console.log(`   Lab Investigations Extracted: ${analysis.lab_investigations?.length || 0}`);
    console.log(`   Prescribed Medications Extracted: ${analysis.prescribed_medicines?.length || 0}`);
    console.log(`   Important Findings Identified: ${analysis.important_findings?.length || 0}`);

    // Verify key extractions
    if (!analysis.lab_investigations || analysis.lab_investigations.length < 3) {
      throw new Error(`Expected at least 3 lab investigations, found ${analysis.lab_investigations?.length}`);
    }

    const hbLab = analysis.lab_investigations.find((l) => /hemoglobin|hb/i.test(l.test_name));
    if (!hbLab) {
      throw new Error('Hemoglobin test was not extracted from report');
    }
    console.log(`   -> Hemoglobin: ${hbLab.observed_value} ${hbLab.unit} [Flag: ${hbLab.flag}]`);
    if (hbLab.flag !== 'CRITICAL' && hbLab.flag !== 'LOW') {
      throw new Error(`Expected Hemoglobin to be CRITICAL or LOW, got ${hbLab.flag}`);
    }

    const fbsLab = analysis.lab_investigations.find((l) => /fasting|glucose|sugar|fbs/i.test(l.test_name));
    if (!fbsLab) {
      throw new Error('Fasting Blood Sugar was not extracted from report');
    }
    console.log(`   -> Fasting Sugar: ${fbsLab.observed_value} ${fbsLab.unit} [Flag: ${fbsLab.flag}]`);
    if (fbsLab.flag !== 'HIGH' && fbsLab.flag !== 'CRITICAL') {
      throw new Error(`Expected Fasting Sugar to be HIGH or CRITICAL, got ${fbsLab.flag}`);
    }

    // Verify Dual Summaries
    if (!analysis.clinical_summary || typeof analysis.clinical_summary.physician_digest !== 'string') {
      throw new Error('Clinical summary physician_digest is missing or not a string');
    }
    if (!analysis.patient_summary || typeof analysis.patient_summary.plain_text !== 'string') {
      throw new Error('Patient summary plain_text is missing or not a string');
    }

    console.log('   Clinical Summary Digest Length:', analysis.clinical_summary.physician_digest.length, 'chars');
    console.log('   Patient Summary Plain Text Length:', analysis.patient_summary.plain_text.length, 'chars');
    console.log('✅ PASSED: Multi-tier AI extracted rich structured data, abnormal flags, and dual summaries.\n');

    // ========================================================================
    // TEST 2: Document Upload Processing & MongoDB Persistence
    // ========================================================================
    console.log('--- TEST 2: Document Upload Processing & Persistence ---');
    const processResult = await documentService.processAndPersistDocument({
      directText: sampleExtractedText,
      fileName: 'sunita_apollo_lab.txt',
      fileSize: sampleExtractedText.length,
      mimeType: 'text/plain',
      documentType: 'LAB_REPORT',
      patientId: TEST_PATIENT_ID,
      sessionId: TEST_SESSION_ID,
      title: 'Apollo Diagnostic Comprehensive Panel',
    });

    if (processResult.status !== 'success' && processResult.processing_status !== 'COMPLETED') {
      throw new Error(`Document processing failed: ${processResult.error}`);
    }

    const docId = processResult.document_id || processResult.documentId;
    console.log(`   Saved Medical Document ID: ${docId}`);

    // Verify record in MongoDB directly
    const savedDoc = await documentRepository.findByDocumentId(docId);
    if (!savedDoc) {
      throw new Error(`Document ${docId} was not found in MongoDB`);
    }

    if (savedDoc.processing_status !== 'COMPLETED') {
      throw new Error(`Saved document processing_status is ${savedDoc.processing_status}, expected COMPLETED`);
    }

    if (!savedDoc.clinical_summary || !savedDoc.clinical_summary.physician_digest) {
      throw new Error('Saved document in MongoDB missing clinical_summary.physician_digest');
    }

    if (!savedDoc.patient_summary || !savedDoc.patient_summary.about) {
      throw new Error('Saved document in MongoDB missing patient_summary');
    }

    // Verify ClinicalObservation records were generated
    const obs = await ClinicalObservation.find({ session_id: TEST_SESSION_ID });
    console.log(`   Generated Clinical Observations: ${obs.length}`);
    if (obs.length === 0) {
      throw new Error('No ClinicalObservation records were created for the session');
    }

    console.log('✅ PASSED: Document processed, analyzed by AI, and persisted to MongoDB with observations.\n');

    // ========================================================================
    // TEST 3: Clinical Session Intelligence Synchronization
    // ========================================================================
    console.log('--- TEST 3: Clinical Session Intelligence Synchronization ---');
    const updatedSession = await ClinicalSession.findOne({ session_id: TEST_SESSION_ID });
    if (!updatedSession) {
      throw new Error(`Session ${TEST_SESSION_ID} not found`);
    }

    console.log('   Session Medications:', updatedSession.clinical_state?.medications);
    console.log('   Session Medical History:', updatedSession.clinical_state?.relevant_history);
    console.log('   Session Allergies:', updatedSession.clinical_state?.allergies);

    // Verify medications from document were synced to session
    const sessionMeds = updatedSession.clinical_state?.medications || [];
    const hasMetformin = sessionMeds.some((m) => /metformin/i.test(m));
    if (!hasMetformin) {
      throw new Error('Metformin from uploaded document was not synchronized to ClinicalSession medications');
    }

    // Verify history from document was synced to session
    const sessionHistory = updatedSession.clinical_state?.relevant_history || [];
    const hasDiabetes = sessionHistory.some((h) => /diabetes/i.test(h));
    if (!hasDiabetes) {
      throw new Error('Diabetes history from uploaded document was not synchronized to ClinicalSession history');
    }

    console.log('✅ PASSED: Document intelligence seamlessly synchronized into active ClinicalSession.\n');

    // ========================================================================
    // TEST 4: On-Demand AI Re-Analysis Endpoint Method
    // ========================================================================
    console.log('--- TEST 4: On-Demand AI Re-Analysis Endpoint Method ---');
    const reanalyzeResult = await documentService.reanalyzeDocument(docId);
    if (!reanalyzeResult.success || !reanalyzeResult.analysis) {
      throw new Error('Re-analysis method failed');
    }

    console.log(`   Re-analyzed Document: ${reanalyzeResult.document_id}`);
    console.log(`   Re-analysis Investigations: ${reanalyzeResult.analysis.lab_investigations?.length}`);
    console.log(`   Re-analysis Important Findings: ${reanalyzeResult.analysis.important_findings?.length}`);

    if (!reanalyzeResult.updatedDocument?.clinical_summary) {
      throw new Error('Re-analyzed document did not update clinical_summary in MongoDB');
    }

    console.log('✅ PASSED: On-demand AI re-analysis successfully executed and updated in MongoDB.\n');

    // ========================================================================
    // TEST 5: Deterministic Fallback & Clinical Safety Resilience
    // ========================================================================
    console.log('--- TEST 5: Deterministic Fallback & Clinical Safety Resilience ---');
    const fallbackResult = documentService.extractClinicalDataIntelligently(
      sampleExtractedText,
      'LAB_REPORT',
      'offline_test.pdf'
    );

    if (!fallbackResult || !fallbackResult.lab_investigations) {
      throw new Error('Deterministic clinical extractor failed');
    }

    console.log(`   Offline Fallback Investigations Count: ${fallbackResult.lab_investigations.length}`);
    console.log(`   Offline Fallback Findings Count: ${fallbackResult.important_findings.length}`);
    console.log(`   Offline Fallback Summary Present: ${Boolean(fallbackResult.clinical_summary?.physician_digest)}`);

    if (fallbackResult.lab_investigations.length < 3) {
      throw new Error('Offline fallback did not extract expected lab investigations');
    }

    console.log('✅ PASSED: Deterministic fallback engine guarantees zero downtime or crash even if offline.\n');

    console.log('========================================================================');
    console.log('🎉 ALL 5 CLINICAL DOCUMENT AI INTELLIGENCE SUITES PASSED SUCCESSFULLY!');
    console.log('========================================================================\n');
  } finally {
    // Cleanup
    await MedicalDocument.deleteMany({ patient_id: TEST_PATIENT_ID });
    await ClinicalSession.deleteMany({ session_id: TEST_SESSION_ID });
    await ClinicalObservation.deleteMany({ session_id: TEST_SESSION_ID });
    await mongoose.disconnect();
  }
}

runDocumentAiTests().catch((err) => {
  console.error('❌ Document AI Test Suite Failed:', err);
  process.exit(1);
});
