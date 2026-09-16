import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import {
  User,
  Patient,
  PatientIdentity,
  ClinicalSession,
  ClinicalRecord,
  MedicalDocument,
  RedFlagCase,
  DoctorNotification,
  PrescriptionTemplate,
  VitalsRecord,
  Appointment,
  PatientNotification,
  AssistantMedicine,
  AssistantSymptomGuidance,
  AssistantFAQ,
  AssistantWebsiteHelp,
  SeedRun,
} from '../models/index.js';
import { ROLES } from '../constants/roles.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_NAME = 'sehat_initial_seed';
const SEED_VERSION = '1.0.0';

/**
 * Connect to MongoDB for the standalone seeding process
 */
async function connectForSeeding() {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medikiosk_patient_tracking';
  const localFallbackUri = 'mongodb://127.0.0.1:27017/medikiosk_patient_tracking';

  try {
    const conn = await mongoose.connect(primaryUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Seed]: Connected to MongoDB (${conn.connection.name}) on ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`[Seed]: Primary MongoDB connection failed (${err.message}). Trying local fallback...`);
    const fallbackConn = await mongoose.connect(localFallbackUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Seed]: Connected to Local Fallback MongoDB (${fallbackConn.connection.name})`);
    return fallbackConn;
  }
}

/**
 * Main Standalone Seeder
 */
export async function runDatabaseSeed(force = false) {
  console.log('\n========================================');
  console.log('🌱 [Sehat Database Seeder Engine]');
  console.log(`   Target Seed: ${SEED_NAME} v${SEED_VERSION}`);
  console.log('========================================\n');

  await connectForSeeding();

  try {
    // 1. Check persistent seed_runs collection for idempotent one-time execution
    const existingRun = await SeedRun.findOne({ seed_name: SEED_NAME });
    if (existingRun && !force) {
      console.log(`ℹ️ Seed '${SEED_NAME}' version ${existingRun.version} was already executed on ${existingRun.executed_at.toISOString()}.`);
      console.log('✓ Skipping seeding to avoid duplicating or overwriting data.');
      console.log('\n========================================\n');
      return { status: 'skipped', reason: 'already_executed', run: existingRun };
    }

    if (force && existingRun) {
      console.log(`⚠️ Force flag active: Re-running seed '${SEED_NAME}' v${SEED_VERSION}...`);
    } else {
      console.log(`🚀 Executing one-time clinical seed '${SEED_NAME}' v${SEED_VERSION}...`);
    }

    const defaultPasswordHash = await bcrypt.hash('soctor@123', 10);
    const patientPasswordHash = await bcrypt.hash('patient@123', 10);

    // ==========================================
    // 2. SEED DOCTORS (General OPD & All 6 AYUSH)
    // ==========================================
    console.log('👉 Seeding Healthcare Practitioners & Specialists...');
    const doctorsData = [
      // General OPD
      {
        doctor_id: 'DOC-MED-01',
        name: 'Dr. Priya Sharma',
        email: 'priya@gmail.com',
        phone: '+91 98250 11223',
        specialty: 'General Medicine',
        sub_specialty: 'Internal Medicine & Chronic Care',
        opd_type: 'GENERAL',
        opd_system: 'GENERAL_MEDICINE',
        room: 'Room 102 (Main OPD)',
        on_duty: true,
        availability_status: 'AVAILABLE',
        role: ROLES.DOCTOR,
      },
      {
        doctor_id: 'DOC-PED-01',
        name: 'Dr. Rajesh Patel',
        email: 'rajesh.pediatrics@gmail.com',
        phone: '+91 98250 22334',
        specialty: 'Pediatrics',
        sub_specialty: 'Neonatal & Child Health',
        opd_type: 'GENERAL',
        opd_system: 'PEDIATRICS',
        room: 'Room 103 (Pediatric Care)',
        on_duty: true,
        availability_status: 'AVAILABLE',
        role: ROLES.DOCTOR,
      },
      {
        doctor_id: 'DOC-DERM-01',
        name: 'Dr. Ananya Sen',
        email: 'ananya.dermatology@gmail.com',
        phone: '+91 98250 33445',
        specialty: 'Dermatology',
        sub_specialty: 'Clinical & Cosmetic Dermatology',
        opd_type: 'GENERAL',
        opd_system: 'DERMATOLOGY',
        room: 'Room 104 (Skin OPD)',
        on_duty: true,
        availability_status: 'AVAILABLE',
        role: ROLES.DOCTOR,
      },
      // AYUSH — All 6 Recognized Medical Systems
      {
        doctor_id: 'DOC-AYU-01',
        name: 'Dr. Aarav Mehta',
        email: 'aarav.ayurveda@gmail.com',
        phone: '+91 98250 44556',
        specialty: 'Ayurveda',
        sub_specialty: 'Kayachikitsa & Panchakarma',
        opd_type: 'AYUSH',
        opd_system: 'AYURVEDA',
        room: 'Room 201 (AYUSH Wing)',
        on_duty: true,
        availability_status: 'AVAILABLE',
        role: ROLES.DOCTOR,
      },
      {
        doctor_id: 'DOC-HOM-01',
        name: 'Dr. Kavita Joshi',
        email: 'kavita.homoeo@gmail.com',
        phone: '+91 98250 55667',
        specialty: 'Homoeopathy',
        sub_specialty: 'Classical Constitutional Homoeopathy',
        opd_type: 'AYUSH',
        opd_system: 'HOMOEOPATHY',
        room: 'Room 202 (AYUSH Wing)',
        on_duty: true,
        availability_status: 'AVAILABLE',
        role: ROLES.DOCTOR,
      },
      {
        doctor_id: 'DOC-UNA-01',
        name: 'Dr. Tariq Khan',
        email: 'tariq.unani@gmail.com',
        phone: '+91 98250 66778',
        specialty: 'Unani',
        sub_specialty: 'Ilaj-bit-Tadbeer (Regimenal Therapy)',
        opd_type: 'AYUSH',
        opd_system: 'UNANI',
        room: 'Room 203 (AYUSH Wing)',
        on_duty: true,
        availability_status: 'AVAILABLE',
        role: ROLES.DOCTOR,
      },
      {
        doctor_id: 'DOC-SID-01',
        name: 'Dr. S. Meenakshi',
        email: 'meenakshi.siddha@gmail.com',
        phone: '+91 98250 77889',
        specialty: 'Siddha',
        sub_specialty: 'Maruthuvam & Varmam Care',
        opd_type: 'AYUSH',
        opd_system: 'SIDDHA',
        room: 'Room 204 (AYUSH Wing)',
        on_duty: true,
        availability_status: 'AVAILABLE',
        role: ROLES.DOCTOR,
      },
      {
        doctor_id: 'DOC-YOG-01',
        name: 'Dr. Sunita Rao',
        email: 'sunita.naturopathy@gmail.com',
        phone: '+91 98250 88990',
        specialty: 'Yoga & Naturopathy',
        sub_specialty: 'Lifestyle Lifestyle & Hydrotherapy',
        opd_type: 'AYUSH',
        opd_system: 'YOGA_NATUROPATHY',
        room: 'Room 205 (Wellness Block)',
        on_duty: true,
        availability_status: 'AVAILABLE',
        role: ROLES.DOCTOR,
      },
      {
        doctor_id: 'DOC-SOW-01',
        name: 'Dr. Tenzin Norbu',
        email: 'tenzin.sowa@gmail.com',
        phone: '+91 98250 99001',
        specialty: 'Sowa-Rigpa',
        sub_specialty: 'Traditional Himalayan Medicine (Gso-ba Rig-pa)',
        opd_type: 'AYUSH',
        opd_system: 'SOWA_RIGPA',
        room: 'Room 206 (Himalayan Medicine Block)',
        on_duty: true,
        availability_status: 'AVAILABLE',
        role: ROLES.DOCTOR,
      },
      // System Administrator
      {
        doctor_id: null,
        name: 'Sehat System Administrator',
        email: 'admin@gmail.com',
        phone: '+91 98250 00000',
        specialty: 'Healthcare IT Administration',
        sub_specialty: 'Clinical Operations',
        opd_type: 'GENERAL',
        opd_system: 'GENERAL_MEDICINE',
        room: 'Admin Suite A1',
        on_duty: true,
        availability_status: 'AVAILABLE',
        role: ROLES.ADMIN,
      },
    ];

    for (const d of doctorsData) {
      await User.findOneAndUpdate(
        { email: d.email },
        {
          $set: {
            ...d,
            password_hash: defaultPasswordHash,
            is_active: true,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`   ✓ Inserted/Updated ${doctorsData.length} Healthcare Practitioner accounts.`);

    // ==========================================
    // 3. SEED PATIENTS (Clinical Scenarios A - E)
    // ==========================================
    console.log('👉 Seeding Realistic Synthetic Healthcare Patient Cohort...');
    const patientsData = [
      // Patient A: General OPD (Fever, cough, CBC report, low/moderate triage)
      {
        patient_id: 'PAT-GEN-001',
        first_name: 'Ramesh',
        last_name: 'Patel',
        date_of_birth: new Date(1978, 5, 14),
        age:"12",
        gender: 'MALE',
        phone: '+91 98765 43210',
        address: 'B-402, Shivalik Residency, Satellite, Ahmedabad, Gujarat',
        emergency_contact: { name: 'Geeta Patel', phone: '+91 98765 43219', relationship: 'Spouse' },
        current_status: 'IN_SESSION',
        opd_type: 'GENERAL',
        opd_system: 'GENERAL_MEDICINE',
        medical_specialization: 'General Medicine',
        abhaId: '91-4432-8812-9901',
      },
      // Patient B: General OPD (Type 2 Diabetes, Metformin Rx, elevated glucose, follow-up)
      {
        patient_id: 'PAT-GEN-002',
        first_name: 'Sunita',
        last_name: 'Desai',
        date_of_birth: new Date(1972, 8, 22),
        gender: 'FEMALE',
        phone: '+91 98251 22334',
        address: '12, Shanti Kunj Society, Navrangpura, Ahmedabad, Gujarat',
        emergency_contact: { name: 'Kishore Desai', phone: '+91 98251 22339', relationship: 'Spouse' },
        current_status: 'CHECKED_IN',
        opd_type: 'GENERAL',
        opd_system: 'GENERAL_MEDICINE',
        medical_specialization: 'Endocrine & Diabetology',
        abhaId: '91-5543-9923-1122',
      },
      // Patient C: General OPD (Chest discomfort, high-priority emergency scenario)
      {
        patient_id: 'PAT-GEN-003',
        first_name: 'Vikram',
        last_name: 'Mehta',
        date_of_birth: new Date(1965, 2, 10),
        gender: 'MALE',
        phone: '+91 98980 33445',
        address: '701, Harmony Heights, Vastrapur, Ahmedabad, Gujarat',
        emergency_contact: { name: 'Sanjay Mehta', phone: '+91 98980 33449', relationship: 'Son' },
        current_status: 'IN_SESSION',
        opd_type: 'GENERAL',
        opd_system: 'GENERAL_MEDICINE',
        medical_specialization: 'Cardiology',
        abhaId: '91-7788-3344-5566',
      },
      // Patient D: AYUSH -> Ayurveda (Chronic lifestyle digestive complaint / Agnimandya)
      {
        patient_id: 'PAT-AYU-001',
        first_name: 'Deepa',
        last_name: 'Shah',
        date_of_birth: new Date(1987, 11, 5),
        gender: 'FEMALE',
        phone: '+91 97240 44556',
        address: '45, Tulsi Bungalows, Bodakdev, Ahmedabad, Gujarat',
        emergency_contact: { name: 'Nilesh Shah', phone: '+91 97240 44559', relationship: 'Spouse' },
        current_status: 'CHECKED_IN',
        opd_type: 'AYUSH',
        opd_system: 'AYURVEDA',
        medical_specialization: 'Ayurvedic Kayachikitsa',
        abhaId: '91-2233-4455-6677',
      },
      // Patient E: Brand New Patient (No previous medical history, no reports, no appointments)
      {
        patient_id: 'PAT-NEW-001',
        first_name: 'Amit',
        last_name: 'Joshi',
        date_of_birth: new Date(1997, 6, 18),
        gender: 'MALE',
        phone: '+91 96010 55667',
        address: 'G-10, Greenwoods Apartment, Gota, Ahmedabad, Gujarat',
        emergency_contact: { name: 'Pooja Joshi', phone: '+91 96010 55669', relationship: 'Sister' },
        current_status: 'REGISTERED',
        opd_type: 'GENERAL',
        opd_system: 'GENERAL_MEDICINE',
        medical_specialization: 'General Medicine',
        abhaId: '91-8899-0011-2233',
      },
    ];

    for (const p of patientsData) {
      const { abhaId, ...patientFields } = p;
      await Patient.findOneAndUpdate(
        { patient_id: p.patient_id },
        { $set: patientFields },
        { upsert: true, returnDocument: 'after' }
      );

      // Link ABHA Identity in PatientIdentity collection
      if (abhaId) {
        await PatientIdentity.findOneAndUpdate(
          { patient_id: p.patient_id, identity_type: 'ABHA' },
          {
            $set: {
              patient_id: p.patient_id,
              identity_type: 'ABHA',
              identity_reference: abhaId,
              verification_status: 'VERIFIED',
              verified_at: new Date(),
            },
          },
          { upsert: true }
        );
      }
    }
    console.log(`   ✓ Inserted/Updated ${patientsData.length} Patient records & ABHA identities.`);

    // ==========================================
    // 4. SEED CLINICAL SESSIONS / ENCOUNTERS
    // ==========================================
    console.log('👉 Seeding Live Clinical Sessions (Encounters) for Live OPD Queue...');
    const sessionsData = [
      // Session 1: Patient A (Active Intake - Fever & Cough)
      {
        session_id: 'SES-GEN-001A',
        patient_id: 'PAT-GEN-001',
        language: 'gu-IN',
        consultation_type: 'GENERAL',
        opd_type: 'GENERAL',
        opd_system: 'GENERAL_MEDICINE',
        status: 'READY_FOR_DOCTOR',
        journey_stage: 'IN_CONSULTATION',
        journey_step_index: 2,
        chief_complaint_category: 'FEVER',
        red_flags: { has_red_flag: false, severity: 'NONE' },
        triage_level: 'MODERATE',
        triage_reason: 'Acute fever with upper respiratory tract cough for 3 days; vitals stable.',
        clinical_state: {
          chief_complaint: 'Fever and dry cough for past 3 days with generalized weakness',
          symptoms: ['Fever', 'Dry Cough', 'Throat Irritation', 'Body Ache'],
          duration: '3 days',
          severity: 'Moderate',
          body_site: 'Upper Respiratory Tract',
          patient_intent: 'Needs medical advice and prescription for fever management',
        },
        clinical_summary: {
          chief_complaint: 'Fever and dry cough for 3 days',
          history_of_present_illness: 'Patient reports intermittent pyrexia up to 101°F accompanied by dry cough and malaise. Denies breathlessness or hemoptysis.',
          symptoms: ['Fever (101°F)', 'Dry Cough', 'Throat Soreness', 'Malaise'],
          requires_doctor_review: true,
        },
      },
      // Session 2: Patient B (Follow-up Encounter for Diabetes)
      {
        session_id: 'SES-GEN-002A',
        patient_id: 'PAT-GEN-002',
        language: 'en-IN',
        consultation_type: 'GENERAL',
        opd_type: 'GENERAL',
        opd_system: 'GENERAL_MEDICINE',
        status: 'READY_FOR_DOCTOR',
        journey_stage: 'VITALS_TAKEN',
        journey_step_index: 1,
        chief_complaint_category: 'OTHER',
        red_flags: { has_red_flag: false, severity: 'NONE' },
        triage_level: 'LOW',
        triage_reason: 'Routine quarterly diabetes follow-up consultation with recent biochemistry report.',
        clinical_state: {
          chief_complaint: 'Routine follow-up for Type 2 Diabetes; reports morning lethargy',
          symptoms: ['Lethargy', 'Polydipsia', 'Mild Bilateral Foot Tingling'],
          duration: 'Ongoing (5 years)',
          severity: 'Mild to Moderate',
          medications: ['Metformin 500mg BD', 'Amlodipine 5mg OD'],
          patient_intent: 'Physician review of recent high blood sugar results',
        },
        clinical_summary: {
          chief_complaint: 'Diabetes checkup and medication titration',
          history_of_present_illness: '54yo female on oral hypoglycemics presenting with elevated fasting glucose (168 mg/dL). Foot examination reveals early diabetic peripheral paresthesia.',
          symptoms: ['Elevated Glycemia', 'Early Neuropathic Tingling'],
          requires_doctor_review: true,
        },
      },
      // Session 3: Patient C (High-Priority Emergency - Chest Discomfort)
      {
        session_id: 'SES-GEN-003A',
        patient_id: 'PAT-GEN-003',
        language: 'en-IN',
        consultation_type: 'GENERAL',
        opd_type: 'GENERAL',
        opd_system: 'GENERAL_MEDICINE',
        status: 'PRIORITY_TRIAGE',
        journey_stage: 'CHECKED_IN',
        journey_step_index: 0,
        chief_complaint_category: 'CHEST_PAIN',
        red_flags: {
          has_red_flag: true,
          severity: 'HIGH',
          reason: 'Substernal chest pressure with cold diaphoresis and left arm radiation.',
          triggered_at: new Date(),
        },
        triage_level: 'EMERGENCY',
        triage_reason: 'Critical cardiac red-flag: acute coronary syndrome presentation.',
        clinical_state: {
          chief_complaint: 'Acute retrosternal chest crushing pressure radiating to left arm with cold sweats',
          symptoms: ['Chest Pain', 'Radiation to Left Arm', 'Diaphoresis', 'Shortness of Breath'],
          onset: '45 minutes ago',
          severity: 'Severe (8/10)',
          red_flags: ['Chest pressure radiating to left arm', 'Cold clammy sweating', 'Exertional worsening'],
          risk_level: 'EMERGENCY',
          patient_intent: 'Immediate emergency evaluation',
        },
        clinical_summary: {
          chief_complaint: 'Acute substernal chest pressure (ACS suspect)',
          history_of_present_illness: '61yo male smoker presenting with sudden-onset heavy retrosternal pressure radiating down left arm. Immediate ECG and cardiac enzyme evaluation mandated.',
          symptoms: ['Chest Pressure (8/10)', 'Diaphoresis', 'Dyspnea'],
          requires_doctor_review: true,
        },
      },
      // Session 4: Patient D (AYUSH - Ayurveda Constitutional Consultation)
      {
        session_id: 'SES-AYU-001A',
        patient_id: 'PAT-AYU-001',
        language: 'gu-IN',
        consultation_type: 'AYUSH_AYURVEDA',
        opd_type: 'AYUSH',
        opd_system: 'AYURVEDA',
        status: 'IN_PROGRESS',
        journey_stage: 'CHECKED_IN',
        journey_step_index: 0,
        chief_complaint_category: 'STOMACH_PAIN',
        red_flags: { has_red_flag: false, severity: 'NONE' },
        triage_level: 'LOW',
        triage_reason: 'Chronic digestive complaint; suitable for outpatient Ayurvedic therapeutic care.',
        clinical_state: {
          chief_complaint: 'Chronic postprandial bloating, sluggish digestion, and sour belching (Amlapitta)',
          symptoms: ['Agnimandya (Sluggish Digestion)', 'Adhmana (Bloating)', 'Amlodgara (Sour Eructation)'],
          duration: '3 months',
          severity: 'Mild',
          patient_intent: 'Desires herbal and dietary lifestyle advice',
        },
        ayush_profile: {
          prakriti: 'Pitta-Vata',
          ahara: 'Irregular meal timings, high consumption of fermented and spicy foods',
          vihara: 'Sedentary desk job with late night screen exposure',
          nidra: 'Disturbed sleep, waking around 2:00 AM',
          vyayama: 'Low physical activity',
        },
        clinical_summary: {
          chief_complaint: 'Amlapitta & Agnimandya assessment',
          history_of_present_illness: '39yo female presenting with recurrent indigestion aggravated by irregular food intake. Dashavidha pariksha indicates Pitta-Vata vitiation with impaired Pachaka Pitta.',
          symptoms: ['Bloating', 'Sour Belching', 'Digestive Heaviness'],
          requires_doctor_review: true,
        },
      },
    ];

    for (const s of sessionsData) {
      await ClinicalSession.findOneAndUpdate(
        { session_id: s.session_id },
        { $set: s },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`   ✓ Inserted/Updated ${sessionsData.length} Clinical Sessions/Encounters.`);

    // ==========================================
    // 5. SEED VITALS RECORDS
    // ==========================================
    console.log('👉 Seeding Biometric Vitals Records...');
    const vitalsData = [
      {
        vitals_id: 'VIT-GEN-001',
        patient_id: 'PAT-GEN-001',
        session_id: 'SES-GEN-001A',
        blood_pressure: { systolic: 122, diastolic: 78 },
        pulse: { value: 84, unit: 'bpm' },
        temperature: { value: 100.8, unit: '°F' },
        spo2: { value: 98, unit: '%' },
        respiratory_rate: { value: 18, unit: 'breaths/min' },
        weight: { value: 72, unit: 'kg' },
        height: { value: 172, unit: 'cm' },
        bmi: { value: 24.3, status: 'Normal weight' },
        recorded_by: 'NURSE_STATION_1',
        recorded_at: new Date(),
      },
      {
        vitals_id: 'VIT-GEN-002',
        patient_id: 'PAT-GEN-002',
        session_id: 'SES-GEN-002A',
        blood_pressure: { systolic: 138, diastolic: 86 },
        pulse: { value: 76, unit: 'bpm' },
        temperature: { value: 98.4, unit: '°F' },
        spo2: { value: 97, unit: '%' },
        blood_sugar: { value: 168, type: 'FASTING', unit: 'mg/dL' },
        weight: { value: 68, unit: 'kg' },
        height: { value: 158, unit: 'cm' },
        bmi: { value: 27.2, status: 'Overweight' },
        recorded_by: 'TRIAGE_OFFICER',
        recorded_at: new Date(),
      },
      {
        vitals_id: 'VIT-GEN-003',
        patient_id: 'PAT-GEN-003',
        session_id: 'SES-GEN-003A',
        blood_pressure: { systolic: 154, diastolic: 96 },
        pulse: { value: 102, unit: 'bpm' },
        temperature: { value: 98.6, unit: '°F' },
        spo2: { value: 93, unit: '%' },
        respiratory_rate: { value: 24, unit: 'breaths/min' },
        weight: { value: 81, unit: 'kg' },
        height: { value: 170, unit: 'cm' },
        bmi: { value: 28.0, status: 'Overweight' },
        notes: 'Cold diaphoresis observed at kiosk triage.',
        recorded_by: 'EMERGENCY_DESK',
        recorded_at: new Date(),
      },
      {
        vitals_id: 'VIT-AYU-001',
        patient_id: 'PAT-AYU-001',
        session_id: 'SES-AYU-001A',
        blood_pressure: { systolic: 116, diastolic: 74 },
        pulse: { value: 72, unit: 'bpm' },
        temperature: { value: 98.2, unit: '°F' },
        spo2: { value: 99, unit: '%' },
        weight: { value: 57, unit: 'kg' },
        height: { value: 161, unit: 'cm' },
        bmi: { value: 22.0, status: 'Healthy' },
        recorded_by: 'AYUSH_WELLNESS_KIOSK',
        recorded_at: new Date(),
      },
    ];

    for (const v of vitalsData) {
      await VitalsRecord.findOneAndUpdate(
        { vitals_id: v.vitals_id },
        { $set: v },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`   ✓ Inserted/Updated ${vitalsData.length} Vitals records.`);

    // ==========================================
    // 6. SEED RED-FLAG CASE FOR EMERGENCY (Patient C)
    // ==========================================
    console.log('👉 Seeding Emergency Red-Flag Trigger...');
    await RedFlagCase.findOneAndUpdate(
      { clinical_session_id: 'SES-GEN-003A' },
      {
        $set: {
          case_id: 'RFC-GEN-003A',
          patient_id: 'PAT-GEN-003',
          clinical_session_id: 'SES-GEN-003A',
          risk_level: 'CRITICAL',
          priority: 'EMERGENCY',
          trigger: {
            category: 'CHEST_PAIN',
            reason: 'Acute substernal crushing pain with diaphoresis and arm radiation',
            detected_keywords: ['chest pain', 'radiating to left arm', 'sweating'],
          },
          status: 'BROADCAST',
          broadcast_acknowledged: false,
          created_at: new Date(),
        },
      },
      { upsert: true }
    );
    console.log('   ✓ Seeded Red-Flag Case for Patient C.');

    // ==========================================
    // 7. SEED MEDICAL DOCUMENTS (OCR & Summaries)
    // ==========================================
    console.log('👉 Seeding Diagnostic Medical Documents & Dual AI Summaries...');
    const documentsData = [
      {
        document_id: 'DOC-CBC-001',
        patient_id: 'PAT-GEN-001',
        session_id: 'SES-GEN-001A',
        document_type: 'LAB_REPORT',
        file_url: '/uploads/sample_cbc_report.pdf',
        file_name: 'Complete_Blood_Count_Report.pdf',
        file_size: 142850,
        mime_type: 'application/pdf',
        processing_status: 'COMPLETED',
        confidence_score: 0.96,
        extraction_confidence: 'CLEAR',
        requires_doctor_verification: false,
        extracted_text: `APEX PATHOLOGY DIAGNOSTICS
Patient: Ramesh Patel (48M) | Ref: Dr. Priya Sharma
TEST: COMPLETE HEMOGRAM (CBC)
Hemoglobin: 14.6 g/dL (Ref: 13.0 - 17.0) NORMAL
TLC (Total Leukocyte Count): 11,800 /cumm (Ref: 4,000 - 11,000) HIGH
Neutrophils: 74% (Ref: 40 - 70) HIGH
Lymphocytes: 20% (Ref: 20 - 40) NORMAL
Platelet Count: 285,000 /cumm (Ref: 150,000 - 450,000) NORMAL
ESR: 24 mm/hr (Ref: 0 - 15) ELEVATED`,
        extracted_data: {
          doctor: { name: 'Dr. Priya Sharma', facility: 'Apex Diagnostics' },
          lab_results: [
            { test_name: 'Hemoglobin', observed_value: '14.6', unit: 'g/dL', reference_range: '13.0 - 17.0', flag: 'NORMAL' },
            { test_name: 'Total Leukocyte Count (TLC)', observed_value: '11,800', unit: '/cumm', reference_range: '4,000 - 11,000', flag: 'HIGH' },
            { test_name: 'Neutrophils', observed_value: '74', unit: '%', reference_range: '40 - 70', flag: 'HIGH' },
            { test_name: 'Erythrocyte Sedimentation Rate (ESR)', observed_value: '24', unit: 'mm/hr', reference_range: '0 - 15', flag: 'HIGH' },
            { test_name: 'Platelet Count', observed_value: '285,000', unit: '/cumm', reference_range: '150,000 - 450,000', flag: 'NORMAL' },
          ],
        },
        clinical_summary: {
          physician_digest: 'CBC indicates mild neutrophilic leukocytosis (TLC 11,800 /cumm, Neutrophils 74%) and elevated ESR (24 mm/hr), consistent with an active acute infectious/inflammatory process (likely bacterial or viral tracheobronchitis). Hemoglobin and platelet indices are within normal limits.',
          primary_concern: 'Mild neutrophilia indicating acute infection',
        },
        patient_summary: {
          title: 'Complete Blood Count (CBC) Report',
          date: 'Recent',
          about: 'This is your complete blood test analyzing red blood cells, white blood cells, and platelets.',
          findings: [
            { parameter: 'White Blood Cell Count (TLC)', status: 'HIGH', interpretation: 'Slightly higher than normal, indicating your immune system is actively fighting an infection.' },
            { parameter: 'Hemoglobin', status: 'NORMAL', interpretation: 'Normal red blood cell and oxygen-carrying capacity.' },
            { parameter: 'Platelets', status: 'NORMAL', interpretation: 'Normal blood clotting ability.' },
          ],
          meaning: 'Your white blood cell count is mildly elevated, which is expected when your body is responding to fever or cough.',
          action: 'Please share this report with your physician during your upcoming appointment so they can prescribe appropriate care.',
          disclaimer: 'This summary is generated from your uploaded report and is NOT a medical diagnosis. Only your treating physician can interpret results in context.',
        },
        important_findings: [
          { finding: 'TLC (Total Leukocyte Count)', status: 'HIGH', severity: 'MODERATE', interpretation: 'Mild leukocytosis consistent with acute infection' },
          { finding: 'ESR', status: 'HIGH', severity: 'LOW', interpretation: 'Mild acute phase reactant elevation' },
        ],
      },
      {
        document_id: 'DOC-GLU-002',
        patient_id: 'PAT-GEN-002',
        session_id: 'SES-GEN-002A',
        document_type: 'LAB_REPORT',
        file_url: '/uploads/sample_glucose_report.pdf',
        file_name: 'Glycemic_Profile_HbA1c.pdf',
        file_size: 165320,
        mime_type: 'application/pdf',
        processing_status: 'COMPLETED',
        confidence_score: 0.98,
        extraction_confidence: 'CLEAR',
        requires_doctor_verification: true,
        extracted_text: `CIVIL HOSPITAL CLINICAL BIOCHEMISTRY
Patient: Sunita Desai (54F) | Consultant: Dr. Priya Sharma
TEST: GLYCEMIC PROFILE
Fasting Blood Sugar (FBS): 168 mg/dL (Ref: 70 - 100) HIGH
Post-Prandial Blood Sugar (PPBS): 234 mg/dL (Ref: < 140) HIGH
HbA1c (Glycated Hemoglobin): 7.9% (Ref: < 5.7) HIGH
Estimated Average Glucose (eAG): 180 mg/dL`,
        extracted_data: {
          doctor: { name: 'Dr. Priya Sharma', facility: 'Civil Hospital Biochemistry' },
          lab_results: [
            { test_name: 'Fasting Blood Sugar (FBS)', observed_value: '168', unit: 'mg/dL', reference_range: '70 - 100', flag: 'HIGH' },
            { test_name: 'Post-Prandial Glucose (PPBS)', observed_value: '234', unit: 'mg/dL', reference_range: '< 140', flag: 'HIGH' },
            { test_name: 'HbA1c', observed_value: '7.9', unit: '%', reference_range: '< 5.7', flag: 'HIGH' },
          ],
        },
        clinical_summary: {
          physician_digest: 'Glycemic profile demonstrates suboptimal diabetic control: Fasting blood sugar 168 mg/dL and HbA1c 7.9% (target for age < 7.0%). Suggests requirement for oral hypoglycemic agent dose titration or lifestyle modification review.',
        },
        patient_summary: {
          title: 'Blood Sugar & HbA1c Report',
          date: 'Recent',
          about: 'This test measures your current blood glucose and your average blood sugar levels over the past 3 months.',
          findings: [
            { parameter: 'Fasting Blood Sugar', status: 'HIGH', interpretation: '168 mg/dL (higher than the ideal target of under 100-120 mg/dL).' },
            { parameter: 'HbA1c (3-Month Average)', status: 'HIGH', interpretation: '7.9% (indicates your diabetes has been running higher than recommended recently).' },
          ],
          meaning: 'Your blood sugar numbers are higher than target ranges, indicating your current diabetes management may need adjustment.',
          action: 'Discuss medication adjustment and diet with Dr. Priya Sharma during your consultation.',
          disclaimer: 'This summary is generated for educational purposes and is not a prescription. Do not alter medicine doses without consulting your doctor.',
        },
        important_findings: [
          { finding: 'HbA1c: 7.9%', status: 'HIGH', severity: 'MODERATE', interpretation: 'Suboptimal 3-month glycemic control' },
          { finding: 'Fasting Blood Sugar: 168 mg/dL', status: 'HIGH', severity: 'MODERATE', interpretation: 'Elevated morning fasting glucose' },
        ],
      },
    ];

    for (const doc of documentsData) {
      await MedicalDocument.findOneAndUpdate(
        { document_id: doc.document_id },
        { $set: doc },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`   ✓ Inserted/Updated ${documentsData.length} Diagnostic Medical Documents.`);

    // ==========================================
    // 8. SEED APPOINTMENTS
    // ==========================================
    console.log('👉 Seeding Doctor & Patient Appointments...');
    const appointmentsData = [
      {
        appointment_id: 'APT-GEN-001',
        patient_id: 'PAT-GEN-001',
        doctor_id: 'DOC-MED-01',
        doctor_name: 'Dr. Priya Sharma',
        doctor_specialization: 'General Medicine',
        appointment_date: new Date(Date.now() + 86400000), // Tomorrow
        appointment_time: '10:30 AM',
        room: 'Room 102 (Main OPD)',
        status: 'SCHEDULED',
        consultation_type: 'IN_PERSON',
        reason: 'Follow-up clinical consultation for respiratory symptoms',
      },
      {
        appointment_id: 'APT-GEN-002',
        patient_id: 'PAT-GEN-002',
        doctor_id: 'DOC-MED-01',
        doctor_name: 'Dr. Priya Sharma',
        doctor_specialization: 'General Medicine',
        appointment_date: new Date(Date.now() + 172800000), // In 2 days
        appointment_time: '11:15 AM',
        room: 'Room 102 (Main OPD)',
        status: 'SCHEDULED',
        consultation_type: 'IN_PERSON',
        reason: 'Quarterly diabetic medication adjustment review',
      },
      {
        appointment_id: 'APT-AYU-001',
        patient_id: 'PAT-AYU-001',
        doctor_id: 'DOC-AYU-01',
        doctor_name: 'Dr. Aarav Mehta',
        doctor_specialization: 'Ayurveda',
        appointment_date: new Date(Date.now() + 259200000), // In 3 days
        appointment_time: '04:00 PM',
        room: 'Room 201 (AYUSH Wing)',
        status: 'SCHEDULED',
        consultation_type: 'IN_PERSON',
        reason: 'Ayurvedic Prakriti counseling & Panchakarma intake',
      },
    ];

    for (const apt of appointmentsData) {
      await Appointment.findOneAndUpdate(
        { appointment_id: apt.appointment_id },
        { $set: apt },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`   ✓ Inserted/Updated ${appointmentsData.length} Appointments.`);

    // ==========================================
    // 9. SEED NOTIFICATIONS (Doctor & Patient)
    // ==========================================
    console.log('👉 Seeding Doctor & Patient Notifications...');
    await DoctorNotification.findOneAndUpdate(
      { notification_id: 'DNOT-001' },
      {
        $set: {
          notification_id: 'DNOT-001',
          doctor_id: 'DOC-MED-01',
          type: 'RED_FLAG_EMERGENCY',
          priority: 'CRITICAL',
          title: '🚨 Cardiac Emergency Triage: Patient Vikram Mehta',
          message: 'Patient presenting with 8/10 crushing chest pressure radiating to left arm. Priority triage room assigned.',
          session_id: 'SES-GEN-003A',
          is_read: false,
        },
      },
      { upsert: true }
    );

    await PatientNotification.findOneAndUpdate(
      { notification_id: 'PNOT-001' },
      {
        $set: {
          notification_id: 'PNOT-001',
          patient_id: 'PAT-GEN-001',
          type: 'QUEUE_UPDATE',
          title: 'Token Called — OPD Room 102',
          message: 'Your token TK-101 has been called for consultation with Dr. Priya Sharma in Room 102.',
          is_read: false,
        },
      },
      { upsert: true }
    );
    console.log('   ✓ Seeded Notifications.');

    // ==========================================
    // 10. SEED CLINICAL KNOWLEDGE BASE (Rules)
    // ==========================================
    console.log('👉 Seeding Clinical Knowledge Base & Assistant Guidance...');
    const knowledgePath = path.join(__dirname, '../data/assistant_knowledge.json');
    if (fs.existsSync(knowledgePath)) {
      try {
        const rawJson = fs.readFileSync(knowledgePath, 'utf8');
        const parsedData = JSON.parse(rawJson);

        if (parsedData.medicines && Array.isArray(parsedData.medicines)) {
          for (const m of parsedData.medicines) {
            await AssistantMedicine.findOneAndUpdate({ medicine_id: m.medicine_id }, { $set: m }, { upsert: true });
          }
        }
        if (parsedData.symptom_guidance && Array.isArray(parsedData.symptom_guidance)) {
          for (const s of parsedData.symptom_guidance) {
            await AssistantSymptomGuidance.findOneAndUpdate({ symptom_key: s.symptom_key }, { $set: s }, { upsert: true });
          }
        }
        if (parsedData.faqs && Array.isArray(parsedData.faqs)) {
          for (const f of parsedData.faqs) {
            await AssistantFAQ.findOneAndUpdate({ faq_id: f.faq_id }, { $set: f }, { upsert: true });
          }
        }
        if (parsedData.website_help && Array.isArray(parsedData.website_help)) {
          for (const w of parsedData.website_help) {
            await AssistantWebsiteHelp.findOneAndUpdate({ topic: w.topic }, { $set: w }, { upsert: true });
          }
        }
        console.log('   ✓ Seeded Clinical Assistant Knowledge Base.');
      } catch (kErr) {
        console.warn('   ⚠️ Could not load assistant_knowledge.json:', kErr.message);
      }
    }

    // ==========================================
    // 11. RECORD PERSISTENT SEED EXECUTION
    // ==========================================
    const executionRecord = await SeedRun.findOneAndUpdate(
      { seed_name: SEED_NAME },
      {
        $set: {
          seed_name: SEED_NAME,
          version: SEED_VERSION,
          executed_at: new Date(),
          details: {
            doctors_seeded: doctorsData.length,
            patients_seeded: patientsData.length,
            sessions_seeded: sessionsData.length,
            vitals_seeded: vitalsData.length,
            documents_seeded: documentsData.length,
            appointments_seeded: appointmentsData.length,
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    console.log('\n========================================');
    console.log(`✅ [SUCCESS]: Sehat Database Initial Seed Completed!`);
    console.log(`   Seed Version: ${SEED_VERSION}`);
    console.log(`   Execution Record ID: ${executionRecord._id}`);
    console.log(`   Recorded in 'seed_runs' collection.`);
    console.log('========================================\n');

    return { status: 'success', version: SEED_VERSION, record: executionRecord };
  } catch (error) {
    console.error('\n❌ [ERROR] Seeding failed with uncaught exception:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('[Seed]: Database connection closed cleanly.');
  }
}

// Allow direct CLI execution: `node src/scripts/seedDatabase.js`
if (process.argv[1] && process.argv[1].endsWith('seedDatabase.js')) {
  const isForce = process.argv.includes('--force');
  runDatabaseSeed(isForce)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runDatabaseSeed;
