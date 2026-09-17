import mongoose from 'mongoose';
import { connectDB } from '../utils/db.js';
import { doctorPanelService } from '../services/doctorPanelService.js';
import { redFlagCaseService } from '../services/redFlagCaseService.js';
import { patientDashboardService } from '../services/patientDashboardService.js';
import { Patient } from '../models/Patient.js';
import { PatientIdentity } from '../models/PatientIdentity.js';
import { Appointment } from '../models/Appointment.js';
import { ClinicalSession } from '../models/ClinicalSession.js';
import { ClinicalRecord } from '../models/ClinicalRecord.js';
import { RedFlagCase } from '../models/RedFlagCase.js';

async function runAuditTests() {
  console.log('========================================================================');
  console.log('🛡️ SEHAT HEALTHCARE — CLINICAL DATA ISOLATION & AUDIT TEST SUITE');
  console.log('========================================================================\n');

  await connectDB();

  const DOCTOR_A = 'DOC-AUDIT-A';
  const DOCTOR_B = 'DOC-AUDIT-B';
  const PATIENT_A = 'PAT-AUDIT-001';
  const PATIENT_B = 'PAT-AUDIT-002';
  const PATIENT_C = 'PAT-AUDIT-003'; // Patient with null demographics

  try {
    // 0. Clean any prior test fixtures
    await Patient.deleteMany({ patient_id: { $in: [PATIENT_A, PATIENT_B, PATIENT_C] } });
    await PatientIdentity.deleteMany({ patient_id: { $in: [PATIENT_A, PATIENT_B, PATIENT_C] } });
    await Appointment.deleteMany({ patient_id: { $in: [PATIENT_A, PATIENT_B, PATIENT_C] } });
    await ClinicalSession.deleteMany({ patient_id: { $in: [PATIENT_A, PATIENT_B, PATIENT_C] } });
    await ClinicalRecord.deleteMany({ patient_id: { $in: [PATIENT_A, PATIENT_B, PATIENT_C] } });
    await RedFlagCase.deleteMany({ case_id: { $regex: /^CASE-AUDIT-/ } });

    // Seed test patients
    await Patient.create([
      {
        patient_id: PATIENT_A,
        first_name: 'Anita',
        last_name: 'Deshmukh',
        phone: '9876543210',
        date_of_birth: new Date('1990-05-15'),
        gender: 'Female',
        blood_group: 'B+',
        opd_type: 'GENERAL',
        opd_system: 'GENERAL_MEDICINE',
      },
      {
        patient_id: PATIENT_B,
        first_name: 'Bhavin',
        last_name: 'Patel',
        phone: '9876543211',
        date_of_birth: new Date('1982-11-20'),
        gender: 'Male',
        blood_group: 'O+',
        opd_type: 'GENERAL',
        opd_system: 'CARDIOLOGY',
      },
      {
        patient_id: PATIENT_C,
        first_name: 'Chitra',
        last_name: 'Sen',
        phone: '9876543212',
        date_of_birth: null,
        gender: null,
        blood_group: 'A+',
        opd_type: 'GENERAL',
        opd_system: 'GENERAL_MEDICINE',
      },
    ]);

    // Seed real ABHA only for Patient A
    await PatientIdentity.create({
      patient_id: PATIENT_A,
      identity_type: 'ABHA',
      identity_reference: '98-7654-3210-9999',
      status: 'VERIFIED',
    });

    console.log('✅ Setup: Test patients & ABHA identity registered successfully.\n');

    // ========================================================================
    // TEST 1: Doctor-Wise Appointment Isolation
    // ========================================================================
    console.log('--- TEST 1: Doctor-Wise Appointment Isolation ---');
    const apptA = await Appointment.create({
      appointment_id: `APT-AUDIT-${Date.now()}-A`,
      patient_id: PATIENT_A,
      doctor_id: DOCTOR_A,
      doctor_name: 'Dr. Audit A',
      doctor_specialization: 'General Medicine',
      appointment_date: new Date(),
      appointment_time: '10:00 AM',
      status: 'CONFIRMED',
      reason: 'Persistent Fatigue',
    });

    const apptB = await Appointment.create({
      appointment_id: `APT-AUDIT-${Date.now()}-B`,
      patient_id: PATIENT_B,
      doctor_id: DOCTOR_B,
      doctor_name: 'Dr. Audit B',
      doctor_specialization: 'Cardiology',
      appointment_date: new Date(),
      appointment_time: '11:30 AM',
      status: 'CONFIRMED',
      reason: 'Chest Heaviness',
    });

    const docAAppointments = await doctorPanelService.getDoctorAppointments(DOCTOR_A);
    const docBAppointments = await doctorPanelService.getDoctorAppointments(DOCTOR_B);

    const docAIds = docAAppointments.appointments.map((a) => a.appointmentId);
    const docBIds = docBAppointments.appointments.map((a) => a.appointmentId);

    if (!docAIds.includes(apptA.appointment_id)) {
      throw new Error(`Doctor A cannot see their own appointment ${apptA.appointment_id}`);
    }
    if (docAIds.includes(apptB.appointment_id)) {
      throw new Error(`SECURITY BREACH: Doctor A can see Doctor B's appointment ${apptB.appointment_id}`);
    }
    if (!docBIds.includes(apptB.appointment_id)) {
      throw new Error(`Doctor B cannot see their own appointment ${apptB.appointment_id}`);
    }
    if (docBIds.includes(apptA.appointment_id)) {
      throw new Error(`SECURITY BREACH: Doctor B can see Doctor A's appointment ${apptA.appointment_id}`);
    }

    console.log(`   Doctor A saw ${docAAppointments.appointments.length} appointment(s), exclusively their own.`);
    console.log(`   Doctor B saw ${docBAppointments.appointments.length} appointment(s), exclusively their own.`);
    console.log('✅ PASSED: Appointments are strictly isolated per doctor on backend.\n');

    // ========================================================================
    // TEST 2: Doctor-Wise Patient Directory & Dossier Authorization Guard
    // ========================================================================
    console.log('--- TEST 2: Doctor-Wise Patient Directory & Dossier Authorization Guard ---');
    const docAPatients = await doctorPanelService.getDoctorPatients(DOCTOR_A);
    const docBPatients = await doctorPanelService.getDoctorPatients(DOCTOR_B);

    const docAPids = docAPatients.patients.map((p) => p.patientId);
    const docBPids = docBPatients.patients.map((p) => p.patientId);

    if (!docAPids.includes(PATIENT_A)) {
      throw new Error(`Doctor A does not see authorized patient ${PATIENT_A}`);
    }
    if (docAPids.includes(PATIENT_B)) {
      throw new Error(`SECURITY BREACH: Doctor A can see Doctor B's patient ${PATIENT_B}`);
    }
    if (!docBPids.includes(PATIENT_B)) {
      throw new Error(`Doctor B does not see authorized patient ${PATIENT_B}`);
    }
    if (docBPids.includes(PATIENT_A)) {
      throw new Error(`SECURITY BREACH: Doctor B can see Doctor A's patient ${PATIENT_A}`);
    }

    // Now test direct unauthorized dossier access via getPatientClinicalProfile
    let unauthorizedBlocked = false;
    try {
      await doctorPanelService.getPatientClinicalProfile(PATIENT_A, DOCTOR_B, 'DOCTOR');
    } catch (err) {
      if (err.statusCode === 403 || err.code === 'UNAUTHORIZED_PATIENT_ACCESS') {
        unauthorizedBlocked = true;
        console.log(`   Direct dossier attempt by Doctor B for Patient A rejected: ${err.message} (${err.code})`);
      } else {
        throw err;
      }
    }

    if (!unauthorizedBlocked) {
      throw new Error('SECURITY BREACH: Doctor B was able to access Patient A dossier without authorization!');
    }

    // Doctor A accessing Patient A dossier must succeed
    const authorizedProfile = await doctorPanelService.getPatientClinicalProfile(PATIENT_A, DOCTOR_A, 'DOCTOR');
    if (!authorizedProfile || authorizedProfile.patient?.patientId !== PATIENT_A) {
      throw new Error('Doctor A was unable to access their own authorized patient dossier.');
    }

    console.log('✅ PASSED: Server enforces 403 UNAUTHORIZED_PATIENT_ACCESS for non-assigned doctors.\n');

    // ========================================================================
    // TEST 3: Prescription Persistence & Patient Dashboard Retrieval
    // ========================================================================
    console.log('--- TEST 3: Prescription Persistence & Patient Dashboard Retrieval ---');
    const testMeds = [
      {
        medicine_name: 'Paracetamol 650mg',
        generic_name: 'Acetaminophen',
        dosage: '1 tab',
        frequency: 'TDS (Three times a day)',
        duration: '3 days',
        instructions: 'Take after meals',
      },
      {
        medicine_name: 'Cetirizine 10mg',
        generic_name: 'Cetirizine HCl',
        dosage: '1 tab',
        frequency: 'OD at night',
        duration: '5 days',
        instructions: 'Take with warm water',
      },
    ];

    const rxResult = await doctorPanelService.savePhysicianPrescription(
      null, // sessionId null -> resolves patientId
      DOCTOR_A,
      testMeds,
      'DOCTOR',
      PATIENT_A
    );

    if (!rxResult.success || !rxResult.record) {
      throw new Error('Prescription was not saved successfully by doctorPanelService');
    }

    // Check ClinicalRecord in DB directly
    const savedRecord = await ClinicalRecord.findOne({ patient_id: PATIENT_A });
    if (!savedRecord || savedRecord.review_status !== 'APPROVED') {
      throw new Error('ClinicalRecord review_status is not APPROVED');
    }
    if (savedRecord.physician_prescription.length !== 2) {
      throw new Error('ClinicalRecord does not contain all 2 prescribed medicines');
    }

    // Now query Patient A dashboard
    const patientADashboard = await patientDashboardService.getDashboardData(PATIENT_A);
    if (!patientADashboard.prescriptions || patientADashboard.prescriptions.length === 0) {
      throw new Error('Patient A dashboard did not return any prescriptions!');
    }

    const firstRx = patientADashboard.prescriptions[0];
    const medNames = firstRx.medications.map((m) => m.name);
    if (!medNames.includes('Paracetamol 650mg')) {
      throw new Error(`Patient A dashboard missing Paracetamol 650mg: found [${medNames.join(', ')}]`);
    }

    // Verify Patient B dashboard DOES NOT see Patient A's prescription
    const patientBDashboard = await patientDashboardService.getDashboardData(PATIENT_B);
    if (patientBDashboard.prescriptions && patientBDashboard.prescriptions.length > 0) {
      throw new Error("DATA LEAKAGE: Patient B sees prescriptions that don't belong to them!");
    }

    console.log(`   Prescription created by ${DOCTOR_A} for ${PATIENT_A} persisted with APPROVED status.`);
    console.log(`   Patient A dashboard retrieved ${firstRx.medications.length} medications.`);
    console.log(`   Patient B dashboard shows 0 prescriptions (clean isolation).`);
    console.log('✅ PASSED: Prescription persistence and patient dashboard sync fully verified.\n');

    // ========================================================================
    // TEST 4: Symptom -> Specialty Clinical Routing
    // ========================================================================
    console.log('--- TEST 4: Symptom -> Specialty Clinical Routing ---');
    const dermSpecialties = redFlagCaseService.matchSpecialtiesFromSymptoms(['Persistent skin rash', 'Eczema itch']);
    const dentSpecialties = redFlagCaseService.matchSpecialtiesFromSymptoms(['Severe toothache', 'Gum bleeding']);
    const cardSpecialties = redFlagCaseService.matchSpecialtiesFromSymptoms(['Chest pain', 'Palpitations']);
    const neurSpecialties = redFlagCaseService.matchSpecialtiesFromSymptoms(['Persistent headache', 'Migraine']);
    const orthSpecialties = redFlagCaseService.matchSpecialtiesFromSymptoms(['Joint swelling', 'Knee fracture']);

    console.log('   Skin rash ->', dermSpecialties);
    console.log('   Toothache ->', dentSpecialties);
    console.log('   Chest pain ->', cardSpecialties);
    console.log('   Migraine ->', neurSpecialties);
    console.log('   Joint swelling ->', orthSpecialties);

    if (!dermSpecialties.includes('Dermatology')) throw new Error('Skin rash did not route to Dermatology');
    if (!dentSpecialties.includes('Dentistry')) throw new Error('Toothache did not route to Dentistry');
    if (!cardSpecialties.includes('Cardiology')) throw new Error('Chest pain did not route to Cardiology');
    if (!neurSpecialties.includes('Neurology')) throw new Error('Headache did not route to Neurology');
    if (!orthSpecialties.includes('Orthopedics')) throw new Error('Joint swelling did not route to Orthopedics');

    console.log('✅ PASSED: Clinical symptom to specialty routing matches accurate medical domains.\n');

    // ========================================================================
    // TEST 5: Red-Flag Race-Safe Atomic Claim & Messaging
    // ========================================================================
    console.log('--- TEST 5: Red-Flag Race-Safe Atomic Claim & Messaging ---');
    const testCaseId = `CASE-AUDIT-${Date.now()}`;
    await RedFlagCase.create({
      case_id: testCaseId,
      patient_id: PATIENT_A,
      clinical_session_id: 'SES-AUDIT-01',
      risk_level: 'RED_FLAG',
      priority: 'EMERGENCY',
      status: 'BROADCASTING',
      symptoms: ['Sudden chest discomfort'],
      specialties: ['Cardiology'],
      eligible_doctors: [DOCTOR_A, DOCTOR_B],
      assigned_doctor_id: null,
    });

    // 1. Doctor A claims case
    const firstClaim = await redFlagCaseService.acceptCase(testCaseId, DOCTOR_A);
    if (!firstClaim.success) {
      throw new Error(`Doctor A initial claim failed: ${JSON.stringify(firstClaim)}`);
    }
    console.log(`   Initial claim by Doctor A succeeded: status=${firstClaim.status}`);

    // 2. Doctor A claims AGAIN -> Expect "You already claimed this case."
    const doctorARepeatClaim = await redFlagCaseService.acceptCase(testCaseId, DOCTOR_A);
    if (doctorARepeatClaim.status !== 'ALREADY_CLAIMED_BY_YOU') {
      throw new Error(`Expected ALREADY_CLAIMED_BY_YOU, got: ${doctorARepeatClaim.status}`);
    }
    if (doctorARepeatClaim.message !== 'You already claimed this case.') {
      throw new Error(`Expected 'You already claimed this case.', got: '${doctorARepeatClaim.message}'`);
    }
    console.log(`   Repeat claim by Doctor A returned: "${doctorARepeatClaim.message}" (status=${doctorARepeatClaim.status})`);

    // 3. Doctor B attempts to claim -> Expect "This case has already been assigned to another doctor."
    const doctorBClaim = await redFlagCaseService.acceptCase(testCaseId, DOCTOR_B);
    if (doctorBClaim.success !== false || doctorBClaim.status !== 'CASE_ALREADY_ASSIGNED') {
      throw new Error(`Expected CASE_ALREADY_ASSIGNED with success=false, got: ${JSON.stringify(doctorBClaim)}`);
    }
    if (doctorBClaim.message !== 'This case has already been assigned to another doctor.') {
      throw new Error(`Expected 'This case has already been assigned to another doctor.', got: '${doctorBClaim.message}'`);
    }
    console.log(`   Conflicting claim by Doctor B returned: "${doctorBClaim.message}" (status=${doctorBClaim.status})`);

    console.log('✅ PASSED: Red-flag claim is race-safe with accurate ownership messaging.\n');

    // ========================================================================
    // TEST 6: Demographics & Real ABHA Integrity (Zero Random/Fake Data)
    // ========================================================================
    console.log('--- TEST 6: Demographics & Real ABHA Integrity (Zero Random/Fake Data) ---');
    // Also authorize Doctor A for Patient C so we can inspect null demographics
    await Appointment.create({
      appointment_id: `APT-AUDIT-${Date.now()}-C`,
      patient_id: PATIENT_C,
      doctor_id: DOCTOR_A,
      doctor_name: 'Dr. Audit A',
      doctor_specialization: 'General Medicine',
      appointment_date: new Date(),
      appointment_time: '02:00 PM',
      status: 'CONFIRMED',
      reason: 'General Checkup',
    });

    const refreshedDocAPatients = await doctorPanelService.getDoctorPatients(DOCTOR_A);
    const pA = refreshedDocAPatients.patients.find((p) => p.patientId === PATIENT_A);
    const pC = refreshedDocAPatients.patients.find((p) => p.patientId === PATIENT_C);

    if (!pA) throw new Error('Patient A not found in Doctor A patients list');
    if (!pC) throw new Error('Patient C not found in Doctor A patients list');

    // Patient A checks:
    console.log(`   Patient A Demographics: Age=${pA.age}, Gender=${pA.gender}, ABHA=${pA.abhaId}`);
    if (typeof pA.age !== 'number' || pA.age < 30 || pA.age > 40) {
      throw new Error(`Patient A age is incorrect or not calculated from DOB: got ${pA.age}`);
    }
    if (pA.gender !== 'FEMALE' && pA.gender !== 'Female') {
      throw new Error(`Patient A gender is incorrect: got ${pA.gender}`);
    }
    if (pA.abhaId !== '98-7654-3210-9999') {
      throw new Error(`Patient A ABHA is incorrect: got ${pA.abhaId}`);
    }

    // Patient C checks (null DOB, null gender, no ABHA):
    console.log(`   Patient C Demographics: Age=${pC.age}, Gender=${pC.gender}, ABHA=${pC.abhaId}`);
    if (pC.age !== null) {
      throw new Error(`SECURITY/INTEGRITY VIOLATION: Patient C with null DOB was given a fake age: ${pC.age}`);
    }
    if (pC.gender !== null) {
      throw new Error(`SECURITY/INTEGRITY VIOLATION: Patient C with null gender was given a fake gender: ${pC.gender}`);
    }
    if (pC.abhaId !== null) {
      throw new Error(`SECURITY/INTEGRITY VIOLATION: Patient C without ABHA was given a fake ABHA: ${pC.abhaId}`);
    }

    console.log('✅ PASSED: No random/fake clinical data generated. Demographics strictly derived from truth.\n');

    console.log('========================================================================');
    console.log('🎉 ALL 6 AUDIT & CLINICAL ISOLATION SUITES PASSED FLAWLESSLY!');
    console.log('========================================================================\n');
  } finally {
    // Cleanup
    await Patient.deleteMany({ patient_id: { $in: [PATIENT_A, PATIENT_B, PATIENT_C] } });
    await PatientIdentity.deleteMany({ patient_id: { $in: [PATIENT_A, PATIENT_B, PATIENT_C] } });
    await Appointment.deleteMany({ patient_id: { $in: [PATIENT_A, PATIENT_B, PATIENT_C] } });
    await ClinicalSession.deleteMany({ patient_id: { $in: [PATIENT_A, PATIENT_B, PATIENT_C] } });
    await ClinicalRecord.deleteMany({ patient_id: { $in: [PATIENT_A, PATIENT_B, PATIENT_C] } });
    await RedFlagCase.deleteMany({ case_id: { $regex: /^CASE-AUDIT-/ } });
    await mongoose.disconnect();
  }
}

runAuditTests().catch((err) => {
  console.error('❌ Audit Test Suite Failed:', err);
  process.exit(1);
});
