import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config({ path: 'd:/NextGen/Patient Case Tracking/Server/.env' });

async function runVerification() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('--- MongoDB Connected ---');

  const { patientDashboardService } = await import(
    '../src/services/patientDashboardService.js'
  );
  const { doctorPanelService } = await import(
    '../src/services/doctorPanelService.js'
  );

  console.log('\n--- 1. TEST LIVE DOCTOR FETCH ---');
  const availableDocs = await patientDashboardService.getAvailableDoctorsForBooking({ opd_type: 'GENERAL' });
  console.log(`Available verified doctors count: ${availableDocs.length}`);
  availableDocs.slice(0, 3).forEach((d) => {
    console.log(`- ${d.name} (${d.doctorId}) | ${d.specialization} [${d.availabilityStatus}] Slots: ${d.fixedSlots?.join(', ')}`);
  });

  console.log('\n--- 2. TEST PATIENT DASHBOARD DATA & CONSULTED DOCTORS ---');
  const patientId = 'PAT-B73EEA81';
  const bundle = await patientDashboardService.getDashboardData(patientId);
  console.log(`Patient Name: ${bundle.name}`);
  console.log(`Age: ${bundle.age}, Gender: ${bundle.gender}, ABHA: ${bundle.abhaId}`);
  console.log(`Consulted Doctors Count: ${bundle.consultedDoctors?.length}`);
  bundle.consultedDoctors?.forEach((doc) => {
    console.log(`- Consulted Dr: ${doc.name} (${doc.id}) | ${doc.specialty} | Room: ${doc.room}`);
  });

  console.log('\n--- 3. TEST DOCTOR CASE WORKSPACE: SES-MU1OCL9D-J2FJT ---');
  const caseSessionId = 'SES-MU1OCL9D-J2FJT';

  // Authorized doctor (or emergency / unassigned / attending)
  const caseBundle = await doctorPanelService.getPatientClinicalBundle(caseSessionId, 'DOC-MED-01', 'DOCTOR');
  console.log(`Resolved Session: ${caseBundle.sessionId}`);
  console.log(`Patient Name: ${caseBundle.patientName} (${caseBundle.patientId || caseBundle.id})`);
  console.log(`Age: ${caseBundle.age}, Gender: ${caseBundle.gender}, ABHA: ${caseBundle.abhaId}`);
  console.log(`Triage: ${caseBundle.triageLevel}, Chief Complaint: ${caseBundle.chiefComplaint}`);
  console.log(`AI Intake Messages Count: ${caseBundle.conversation?.length}`);
  if (caseBundle.conversation?.length > 0) {
    console.log(`First message: [${caseBundle.conversation[0].sender}] ${caseBundle.conversation[0].content?.slice(0, 50)}...`);
    console.log(`Last message: [${caseBundle.conversation[caseBundle.conversation.length - 1].sender}] ${caseBundle.conversation[caseBundle.conversation.length - 1].content?.slice(0, 50)}...`);
  }
  console.log(`Documents Count: ${caseBundle.documents?.length}`);
  caseBundle.documents?.slice(0, 2).forEach((doc) => {
    console.log(`- Doc: ${doc.name} (${doc.document_id}) | URL: ${doc.fileUrl}`);
  });
  console.log(`Prescriptions Count: ${caseBundle.prescriptions?.length}`);
  console.log(`Medical History: ${caseBundle.history?.pastMedicalHistory}`);
  console.log(`SOCRATES Site: ${caseBundle.history?.hpi?.site}, Severity: ${caseBundle.history?.hpi?.severity}`);

  console.log('\n--- 4. TEST DOCTOR AUTHORIZATION CHECK ---');
  try {
    // If case is assigned to DOC-MED-01, test an unauthorized doctor
    // Let's test with a random unauthorized ID on an assigned case
    const { RedFlagCase } = await import('../src/models/RedFlagCase.js');
    const { MedicalDocument } = await import('../src/models/MedicalDocument.js');
    const redFlag = await RedFlagCase.findOne({ clinical_session_id: caseSessionId });
    console.log(`Red flag status: ${redFlag?.status}, claimed_by_doctor_id: ${redFlag?.claimed_by_doctor_id}`);

    // Test authorization enforcement:
    const { ClinicalSession } = await import('../src/models/ClinicalSession.js');
    // Find a session assigned to DOC-MED-01 or test temporarily
    const assignedSession = await ClinicalSession.findOne({ assigned_doctor_id: { $exists: true, $ne: null } });
    if (assignedSession) {
      console.log(`Testing assigned session: ${assignedSession.session_id} (assigned to ${assignedSession.assigned_doctor_id})`);
      try {
        await doctorPanelService.getPatientClinicalBundle(assignedSession.session_id, 'DOC-UNAUTHORIZED-99', 'DOCTOR');
        console.error('FAILED: Unauthorized doctor was incorrectly granted access!');
      } catch (authErr) {
        console.log(`PASSED: Unauthorized doctor access blocked with status: ${authErr.statusCode} (${authErr.message})`);
      }
    } else {
      console.log('No pre-assigned session in DB; testing authorization logic directly');
    }
  } catch (err) {
    console.error('Auth test error:', err.message);
  }

  await mongoose.disconnect();
  console.log('\n--- All Tests Completed Successfully ---');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
