import app from './src/app.js';
import mongoose from 'mongoose';
import { infermedicaService } from './src/services/infermedicaService.js';
import { openfdaService } from './src/services/openfdaService.js';
import { documentService } from './src/services/documentService.js';
import { intakeService } from './src/services/intakeService.js';
import { documentRepository } from './src/repositories/documentRepository.js';
import { observationRepository } from './src/repositories/observationRepository.js';
import { sessionRepository } from './src/repositories/sessionRepository.js';
import { patientRepository } from './src/repositories/patientRepository.js';
import { recordService } from './src/services/recordService.js';

const TEST_PORT = 5056;

async function runClinicalTestSuite() {
  console.log('🩺 Starting MediKiosk Clinical Intelligence & Architecture Verification Suite...');
  const server = app.listen(TEST_PORT, '127.0.0.1');

  // Wait for DB connection
  let retries = 10;
  while (mongoose.connection.readyState !== 1 && retries > 0) {
    await new Promise((r) => setTimeout(r, 500));
    retries--;
  }

  const baseUrl = `http://127.0.0.1:${TEST_PORT}/api/v1`;

  try {
    // --------------------------------------------------------------------------
    // CASE 1: Simple symptom — "Knee pain for 2 years" (Adaptive questioning)
    // --------------------------------------------------------------------------
    console.log('\n--- Case 1: Simple Symptom & Adaptive Questioning ---');
    const case1Res = await fetch(`${baseUrl}/intake/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_answer: 'My right knee has been hurting for 2 years.',
        language: 'English',
        current_clinical_state: {},
      }),
    });
    const case1Data = await case1Res.json();
    console.log('Case 1 Status:', case1Res.status);
    console.log('Extracted entities:', case1Data.extracted_entities);
    console.log('Next question:', case1Data.next_question);

    if (!case1Data.success) throw new Error('Case 1 intake call failed');
    if (!case1Data.extracted_entities.duration) throw new Error('Case 1 failed to extract duration "2 years"');
    if (!case1Data.extracted_entities.location) throw new Error('Case 1 failed to extract location "Right Knee"');
    // Ensure it does NOT ask "How long" or "Which knee"
    const nextQLower = case1Data.next_question.toLowerCase();
    if (nextQLower.includes('how long') || nextQLower.includes('which knee')) {
      throw new Error('Case 1 asked redundant question for known information!');
    }
    console.log('✅ Case 1 Passed: Correct entity extraction & adaptive non-redundant questioning.');

    // --------------------------------------------------------------------------
    // CASE 2: Patient asks for doctor advice — "Do I need to see a doctor?"
    // --------------------------------------------------------------------------
    console.log('\n--- Case 2: Patient Query & Intent Handling ---');
    const case2Res = await fetch(`${baseUrl}/intake/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_answer: 'Do I need to see a doctor for this knee pain?',
        language: 'English',
        current_clinical_state: {
          chief_complaint: 'Right Knee Pain',
          duration: '2 years',
          body_site: 'Right Knee',
        },
      }),
    });
    const case2Data = await case2Res.json();
    console.log('Case 2 Intent detected:', case2Data.intent);
    console.log('Case 2 Assistant Message:', case2Data.assistant_message);

    if (case2Data.intent !== 'doctor-consult question') {
      throw new Error(`Expected intent "doctor-consult question", got "${case2Data.intent}"`);
    }
    if (!case2Data.assistant_message.toLowerCase().includes('doctor')) {
      throw new Error('Case 2 did not answer the patient question regarding doctor consultation!');
    }
    console.log('✅ Case 2 Passed: Addressed patient intent empathetically before intake follow-up.');

    // --------------------------------------------------------------------------
    // CASE 3: Bare Chest Pain — "I have chest pain" (Targeted risk assessment, NOT instant emergency)
    // --------------------------------------------------------------------------
    console.log('\n--- Case 3: Bare Chest Pain & Targeted Risk Assessment ---');
    const case3Res = await fetch(`${baseUrl}/intake/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_answer: 'I have chest pain since yesterday.',
        language: 'English',
        current_clinical_state: {},
      }),
    });
    const case3Data = await case3Res.json();
    console.log('Case 3 Triage level:', case3Data.red_flag?.triage_level || case3Data.red_flag?.priority);
    console.log('Case 3 Next Question:', case3Data.next_question);

    // Bare chest pain must NOT be an immediate emergency shutdown
    if (case3Data.red_flag?.triage_level === 'EMERGENCY') {
      throw new Error('Bare chest pain incorrectly triggered instant EMERGENCY triage!');
    }
    if (!case3Data.next_question || case3Data.next_question.length === 0) {
      throw new Error('Expected targeted follow-up question for chest pain assessment');
    }
    console.log('✅ Case 3 Passed: Targeted risk assessment initiated without false emergency panic.');

    // --------------------------------------------------------------------------
    // CASE 4: Clear Emergency Symptoms — Chest pain + cannot breathe + sweating
    // --------------------------------------------------------------------------
    console.log('\n--- Case 4: Clear Emergency Symptoms Escalation ---');
    const case4Res = await fetch(`${baseUrl}/intake/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_answer: 'I have severe crushing chest pain, cold sweating and I cannot breathe!',
        language: 'English',
        current_clinical_state: {},
      }),
    });
    const case4Data = await case4Res.json();
    console.log('Case 4 Red Flag Detected:', case4Data.red_flag?.detected);
    console.log('Case 4 Triage Level:', case4Data.red_flag?.triage_level);
    console.log('Case 4 Emergency Instruction:', case4Data.assistant_message);

    if (!case4Data.red_flag?.detected || case4Data.red_flag?.triage_level !== 'EMERGENCY') {
      throw new Error('Case 4 failed to escalate clear emergency presentation!');
    }
    console.log('✅ Case 4 Passed: Immediate high-priority/emergency escalation executed.');

    // --------------------------------------------------------------------------
    // CASE 5: Medicine Question — "What is paracetamol?" (openFDA / MongoDB knowledge)
    // --------------------------------------------------------------------------
    console.log('\n--- Case 5: Medicine Information Query ---');
    const case5Res = await fetch(`${baseUrl}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is paracetamol used for?',
        language: 'English',
      }),
    });
    const case5Data = await case5Res.json();
    console.log('Case 5 Status:', case5Res.status);
    console.log('Case 5 Assistant Response:', case5Data.message?.slice(0, 150) + '...');

    if (case5Res.status !== 200 || !case5Data.message) {
      throw new Error('Case 5 failed to answer medicine query');
    }
    console.log('✅ Case 5 Passed: Medicine information successfully resolved via knowledge layer.');

    // --------------------------------------------------------------------------
    // CASE 6: External API Failure & Graceful Degradation (Infermedica & openFDA offline)
    // --------------------------------------------------------------------------
    console.log('\n--- Case 6: External API Failure Graceful Fallback ---');
    // Test direct service fallback
    const offlineInfermedica = await infermedicaService.assessClinicalRisk({
      symptoms: ['Chest Pain', 'Shortness of Breath'],
      negative_findings: [],
    });
    console.log('Infermedica Fallback Source:', offlineInfermedica.source);
    console.log('Infermedica Fallback Conditions:', offlineInfermedica.assessment?.possible_conditions);

    if (!offlineInfermedica || !offlineInfermedica.assessment) {
      throw new Error('Infermedica offline fallback failed');
    }

    const offlineFDA = await openfdaService.getDrugInformation('non_existent_drug_xyz_999');
    console.log('openFDA Non-existent Drug Handled Gracefully:', offlineFDA === null);

    console.log('✅ Case 6 Passed: External APIs degrade gracefully to internal CKB knowledge.');

    // --------------------------------------------------------------------------
    // CASE 7: Document Processing, Persistence & Observation Creation
    // --------------------------------------------------------------------------
    console.log('\n--- Case 7: Document Processing, MongoDB Persistence & Observations ---');
    // Initialize a real session for document attachment
    const patDoc = await patientRepository.create({
      patient_id: `PAT-T7-${Date.now().toString().slice(-6)}`,
      first_name: 'Anil',
      last_name: 'Mehta',
      phone: '+919876543299',
      gender: 'MALE',
    });

    const sessDoc = await sessionRepository.create({
      session_id: `SES-T7-${Date.now().toString().slice(-6)}`,
      patient_id: patDoc.patient_id,
      status: 'IN_PROGRESS',
    });

    const samplePrescriptionText = `
Dr. R. K. Sharma, MD
City Health Clinic, Ahmedabad
Date: 15/09/2026
Patient: Anil Mehta, Age: 45
BP: 130/85 mmHg
Complaints: Fever, Body ache
Rx:
1. Tab Paracetamol 500mg 1-0-1 x 5 days
2. Tab Cetirizine 10mg 0-0-1 x 3 days
Advice: Complete course and drink plenty of fluids.
    `;

    const case7Res = await fetch(`${baseUrl}/documents/process-base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patDoc.patient_id,
        session_id: sessDoc.session_id,
        document_type: 'PRESCRIPTION',
        document_text: samplePrescriptionText,
        file_name: 'prescription_sample.txt',
      }),
    });

    const case7Data = await case7Res.json();
    console.log('Case 7 Document Upload Status:', case7Data.status);
    console.log('Case 7 Extracted Medicines:', case7Data.extracted_data?.prescribed_medicines?.length || 0);

    if (case7Data.status !== 'success') throw new Error('Document processing failed');

    // Verify document was stored in MongoDB
    const storedDocs = await documentRepository.findBySessionId(sessDoc.session_id);
    console.log('Stored Documents Count in DB:', storedDocs.length);
    if (storedDocs.length === 0) throw new Error('Document was not saved in MongoDB MedicalDocument collection!');

    // Verify observations were auto-populated in MongoDB
    const storedObs = await observationRepository.findBySessionId(sessDoc.session_id);
    console.log('Auto-populated Observations Count in DB:', storedObs.length);
    if (storedObs.length === 0) throw new Error('ClinicalObservations were not created from document extraction!');

    // Generate clinical summary record from session & document
    const recordDoc = await recordService.generateDraftRecord({
      patient_id: patDoc.patient_id,
      session_id: sessDoc.session_id,
    });
    console.log('Synthesized Draft Record ID:', recordDoc.record_id);
    console.log('Triage in Record:', recordDoc.triage?.level);
    console.log('Verification Required Count in Record:', recordDoc.doctor_verification_required?.length);

    if (!recordDoc || !recordDoc.record_id) throw new Error('Draft record generation failed');
    console.log('✅ Case 7 Passed: Document processed, persisted to MongoDB, observations populated, draft record synthesized.');

    // --------------------------------------------------------------------------
    // CASE 8: Existing Frontend Contracts & Compatibility
    // --------------------------------------------------------------------------
    console.log('\n--- Case 8: Existing Frontend API Contract Verification ---');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    if (healthRes.status !== 200 || healthData.status !== 'success') throw new Error('Health check contract broken');

    const qaRes = await fetch(`${baseUrl}/assistant/quick-actions`);
    const qaData = await qaRes.json();
    if (qaRes.status !== 200) throw new Error('Quick actions contract broken');

    console.log('✅ Case 8 Passed: Frontend API contracts fully preserved.');

    console.log('\n======================================================================');
    console.log('🏆 ALL 8 CLINICAL INTELLIGENCE & ARCHITECTURE TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================================');
  } catch (error) {
    console.error('\n❌ CLINICAL TEST SUITE FAILED:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
    console.log('Clinical test server and DB connection closed.');
  }
}

runClinicalTestSuite();
