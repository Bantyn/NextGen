import connectDB from '../utils/db.js';
import mongoose from 'mongoose';
import { redFlagCaseService } from '../services/redFlagCaseService.js';
import { redFlagRepository } from '../repositories/redFlagRepository.js';
import { doctorNotificationRepository } from '../repositories/doctorNotificationRepository.js';
import { patientRepository } from '../repositories/patientRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { RedFlagCase, RED_FLAG_STATUS } from '../models/RedFlagCase.js';
import { DoctorNotification, NOTIFICATION_STATUS } from '../models/DoctorNotification.js';
import { Patient } from '../models/Patient.js';
import { ClinicalSession } from '../models/ClinicalSession.js';
import { User } from '../models/User.js';

let passedTests = 0;
let totalTests = 9;

function assert(condition, testName) {
  if (!condition) {
    console.error(`❌ FAILED: ${testName}`);
    throw new Error(`Assertion failed for: ${testName}`);
  }
  console.log(`✅ PASSED: ${testName}`);
  passedTests++;
}

async function runTestSuite() {
  console.log('\n========================================================================');
  console.log('🚨 SEHAT BACKEND — RED FLAG CASE ROUTING & DOCTOR HANDOFF TEST SUITE');
  console.log('========================================================================\n');

  await connectDB();

  // Test setup: ensure test patient & session exist
  const testPatientId = 'PAT-TEST-EMERG-01';
  const testSessionId = 'SES-TEST-EMERG-01';

  await Patient.deleteMany({ patient_id: testPatientId });
  await ClinicalSession.deleteMany({ session_id: testSessionId });
  await RedFlagCase.deleteMany({ patient_id: testPatientId });

  await patientRepository.create({
    patient_id: testPatientId,
    first_name: 'TestEmergency',
    last_name: 'Patient',
    phone: '9988776655',
    gender: 'MALE',
    date_of_birth: new Date('1978-04-12'),
  });

  await sessionRepository.create({
    session_id: testSessionId,
    patient_id: testPatientId,
    status: 'IN_PROGRESS',
    clinical_state: {
      chief_complaint: 'Crushing Chest Pain',
      symptoms: ['Chest Pain', 'Left Arm Radiation', 'Dyspnea'],
      severity: 'CRITICAL',
      duration: '30 mins',
      relevant_history: ['Hypertension'],
      allergies: ['Aspirin'],
      medications: ['Amlodipine 5mg'],
    },
    clinical_summary: {
      history_of_present_illness: 'Patient developed acute crushing chest pain with radiation.',
      symptoms: ['Chest Pain', 'Dyspnea'],
    },
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Relevant Specialist Available (Tier 1 Priority)
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 1: Relevant Specialist Matching (Tier 1) ---');
    const trigger1 = await redFlagCaseService.triggerRedFlagCase({
      sessionId: testSessionId,
      patientId: testPatientId,
      triageResult: {
        category: 'CARDIOVASCULAR_EMERGENCY',
        reason: 'Acute cardiovascular distress radiating to left arm.',
        triage_level: 'EMERGENCY',
      },
      state: {
        chief_complaint: 'Crushing Chest Pain',
        symptoms: ['Chest Pain', 'Left Arm Pain'],
      },
    });

    assert(trigger1 && trigger1.case_id, 'Test 1.1: Case ID generated');
    assert(trigger1.tier === 'TIER_1_SPECIALISTS', 'Test 1.2: Routed via TIER_1_SPECIALISTS');
    assert(trigger1.case.specialties.includes('Cardiology'), 'Test 1.3: Cardiology specialty matched');

    // Verify notifications created
    const notifs1 = await doctorNotificationRepository.findActiveByDoctor('DOC-CARD-01');
    const caseNotif1 = notifs1.find((n) => n.case_id === trigger1.case_id);
    assert(caseNotif1 !== undefined, 'Test 1.4: Cardiologist DOC-CARD-01 received active emergency notification');

    const notifsDerm = await doctorNotificationRepository.findActiveByDoctor('DOC-DERM-01');
    const caseNotifDerm = notifsDerm.find((n) => n.case_id === trigger1.case_id);
    assert(caseNotifDerm === undefined, 'Test 1.5: Dermatologist DOC-DERM-01 excluded from primary cardiology alert');

    // -------------------------------------------------------------------------
    // TEST 2: Fallback Broadcast (Tier 2) when no specialist is available
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 2: Fallback Broadcast to All Available Doctors ---');
    const sessionFallbackId = 'SES-TEST-FALLBACK-01';
    const fallbackEligible = await redFlagCaseService.findEligibleDoctors(['NonExistentSpecialty']);
    assert(fallbackEligible.tier === 'TIER_2_FALLBACK', 'Test 2.1: Correctly falls back to TIER_2_FALLBACK');
    assert(fallbackEligible.doctors.length > 0, 'Test 2.2: Available general/emergency doctors populated in fallback');

    // -------------------------------------------------------------------------
    // TEST 3: Doctor Acceptance & Notification Withdrawal
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 3: Single Doctor Acceptance & Alert Withdrawal ---');
    const acceptRes = await redFlagCaseService.acceptCase(trigger1.case_id, 'DOC-CARD-01', { id: 'USER-DOC-01' });
    assert(acceptRes.status === 'CASE_ASSIGNED', 'Test 3.1: Doctor A successfully claims case');
    assert(acceptRes.case.assigned_doctor_id === 'DOC-CARD-01', 'Test 3.2: Case assigned_doctor_id matches DOC-CARD-01');

    const winnerNotif = await doctorNotificationRepository.findNotification(trigger1.case_id, 'DOC-CARD-01');
    assert(winnerNotif.status === NOTIFICATION_STATUS.ACCEPTED, 'Test 3.3: Winner notification status is ACCEPTED');

    // Check that other active notifications for this case were withdrawn
    const remainingActive = await DoctorNotification.find({
      case_id: trigger1.case_id,
      doctor_id: { $ne: 'DOC-CARD-01' },
      status: NOTIFICATION_STATUS.ACTIVE,
    });
    assert(remainingActive.length === 0, 'Test 3.4: All other doctor notifications withdrawn (0 active alerts remaining)');

    // -------------------------------------------------------------------------
    // TEST 4: Concurrency & Atomic Race Condition Protection
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 4: Concurrency & Atomic Claim Protection ---');
    // Create a new fresh broadcasting case
    const raceSessionId = 'SES-TEST-RACE-01';
    const raceTrigger = await redFlagCaseService.triggerRedFlagCase({
      sessionId: raceSessionId,
      patientId: testPatientId,
      triageResult: {
        category: 'CARDIOVASCULAR_EMERGENCY',
        reason: 'Severe distress race condition test',
        triage_level: 'EMERGENCY',
      },
      state: { chief_complaint: 'Race Test' },
    });

    // Simulate 2 doctors clicking ACCEPT at the exact same millisecond
    const [resDocA, resDocB] = await Promise.all([
      redFlagCaseService.acceptCase(raceTrigger.case_id, 'DOC-CARD-01', { id: 'DOC-A' }),
      redFlagCaseService.acceptCase(raceTrigger.case_id, 'DOC-MED-01', { id: 'DOC-B' }),
    ]);

    const successes = [resDocA, resDocB].filter((r) => r.status === 'CASE_ASSIGNED');
    const conflicts = [resDocA, resDocB].filter((r) => r.status === 'CASE_ALREADY_ASSIGNED');

    assert(successes.length === 1, 'Test 4.1: Exactly ONE doctor wins assignment');
    assert(conflicts.length === 1, 'Test 4.2: Second simultaneous claim receives CASE_ALREADY_ASSIGNED');

    // -------------------------------------------------------------------------
    // TEST 5: Unauthorized Access Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 5: Unauthorized Access Gating ---');
    let unauthorizedCaught = false;
    try {
      await redFlagCaseService.getAuthorizedCaseSnapshot(trigger1.case_id, 'DOC-UNAUTHORIZED-09', 'DOCTOR');
    } catch (err) {
      if (err.errorCode === 'FORBIDDEN_CASE_ACCESS' || err.statusCode === 403) {
        unauthorizedCaught = true;
      }
    }
    assert(unauthorizedCaught, 'Test 5.1: Unassigned doctor blocked with 403 FORBIDDEN_CASE_ACCESS');

    // -------------------------------------------------------------------------
    // TEST 6: Case Transfer
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 6: Case Transfer & Audit Trail ---');
    const transferRes = await redFlagCaseService.transferCase({
      caseId: trigger1.case_id,
      fromDoctorId: 'DOC-CARD-01',
      toDoctorId: 'DOC-NEUR-01',
      reason: 'Associated acute neurological symptoms identified.',
      actorId: 'DOC-CARD-01',
      userRole: 'DOCTOR',
    });

    assert(transferRes.success, 'Test 6.1: Case transfer executed');
    assert(transferRes.case.assigned_doctor_id === 'DOC-NEUR-01', 'Test 6.2: Assigned doctor updated to DOC-NEUR-01');
    assert(transferRes.case.transfer_history.length > 0, 'Test 6.3: Transfer history audit recorded');

    // -------------------------------------------------------------------------
    // TEST 7: Availability Changes
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 7: Doctor Live Availability Filtering ---');
    // Temporarily insert an OFF_DUTY doctor in User table
    await User.deleteMany({ email: 'offduty.doc@medikiosk.test' });
    await User.create({
      name: 'Dr. Off Duty',
      email: 'offduty.doc@medikiosk.test',
      password_hash: 'hash',
      role: 'DOCTOR',
      doctor_id: 'DOC-OFFDUTY-01',
      specialty: 'Cardiology',
      on_duty: false,
      availability_status: 'OFF_DUTY',
    });

    const eligibilityCheck = await redFlagCaseService.findEligibleDoctors(['Cardiology']);
    const isOffDutyIncluded = eligibilityCheck.doctors.some((d) => d.doctor_id === 'DOC-OFFDUTY-01');
    assert(!isOffDutyIncluded, 'Test 7.1: Off-duty physician excluded from eligible doctor pool');

    // -------------------------------------------------------------------------
    // TEST 8: Idempotency & Duplicate Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 8: Idempotency & Re-Trigger Handling ---');
    const duplicateTrigger = await redFlagCaseService.triggerRedFlagCase({
      sessionId: testSessionId,
      patientId: testPatientId,
      triageResult: {
        category: 'CARDIOVASCULAR_EMERGENCY',
        reason: 'Duplicate prompt turn',
        triage_level: 'EMERGENCY',
      },
      state: { chief_complaint: 'Repeat Turn' },
    });

    assert(duplicateTrigger.is_existing === true, 'Test 8.1: Re-trigger recognized existing active case');
    assert(duplicateTrigger.case_id === trigger1.case_id, 'Test 8.2: Preserved existing case ID without duplicate record');

    // -------------------------------------------------------------------------
    // TEST 9: Patient Clinical Context Delivery
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 9: Full Authorized Clinical Context Assembly ---');
    const snapshot = await redFlagCaseService.getAuthorizedCaseSnapshot(trigger1.case_id, 'DOC-NEUR-01', 'DOCTOR');

    assert(snapshot.patient && snapshot.patient.patient_id === testPatientId, 'Test 9.1: Patient identity included');
    assert(snapshot.current_health_status && snapshot.current_health_status.chief_complaint, 'Test 9.2: Health status & chief complaint included');
    assert(snapshot.medical_history && snapshot.medical_history.allergies.includes('Aspirin'), 'Test 9.3: Medical history & allergies included');
    assert(snapshot.clinical_summary && snapshot.clinical_summary.data_provenance, 'Test 9.4: Structured AI clinical summary with data provenance included');

    // Clean up test records
    await Patient.deleteMany({ patient_id: testPatientId });
    await ClinicalSession.deleteMany({ session_id: { $in: [testSessionId, raceSessionId] } });
    await RedFlagCase.deleteMany({ case_id: { $in: [trigger1.case_id, raceTrigger.case_id] } });
    await DoctorNotification.deleteMany({ case_id: { $in: [trigger1.case_id, raceTrigger.case_id] } });
    await User.deleteMany({ email: 'offduty.doc@medikiosk.test' });

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} RED FLAG & DOCTOR HANDOFF TESTS PASSED SUCCESSFULLY!`);
    console.log('========================================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Suite Aborted with Error:', error);
    process.exit(1);
  }
}

runTestSuite();
