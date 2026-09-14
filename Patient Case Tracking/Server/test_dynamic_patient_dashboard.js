/**
 * test_dynamic_patient_dashboard.js
 * 
 * End-to-end integration test suite for the Sehat Dynamic Patient Dashboard
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n🧪 ========================================================');
  console.log('🧪 SEHAT — DYNAMIC PATIENT DASHBOARD TEST SUITE');
  console.log('🧪 ========================================================\n');

  try {
    // 1. Test Dashboard Endpoint on registered AYUSH Patient
    console.log('--- 1. Testing GET /api/patient/dashboard for AYUSH Patient ---');
    const res1 = await fetch(`${BASE_URL}/api/patient/dashboard?patient_id=PAT-93E5DD07`);
    assert(res1.status === 200, `GET /api/patient/dashboard returned 200 (Got ${res1.status})`);
    
    const body1 = await res1.json();
    assert(body1.success === true, 'Response has success: true');
    assert(body1.data?.patient?.id === 'PAT-93E5DD07', 'Patient ID matches PAT-93E5DD07');
    assert(body1.data?.patient?.name === 'Banty Patel', 'Patient name is dynamically resolved as Banty Patel');
    assert(body1.data?.patient?.opdType === 'AYUSH', 'OPD Type is dynamic: AYUSH');
    assert(body1.data?.patient?.opdSystem === 'YOGA_NATUROPATHY', 'OPD System is dynamic: YOGA_NATUROPATHY');
    assert(body1.data?.patient?.opdDisplay.includes('YOGA NATUROPATHY'), 'OPD Display correctly formatted');
    assert(Array.isArray(body1.data?.reports), 'Reports is a dynamic array');
    assert(Array.isArray(body1.data?.prescriptions), 'Prescriptions is a dynamic array');
    assert(Array.isArray(body1.data?.consultedDoctors), 'Consulted doctors is a dynamic array');
    assert(body1.data?.counters != null, 'Counters object present');

    // 2. Test Empty States on Patient without vitals
    console.log('\n--- 2. Testing Empty States & Missing Vitals Handling ---');
    // If patient had no vitals before this test, vitals should be null or contain real values
    console.log(`Current vitals state: ${body1.data?.vitals ? 'Recorded' : 'Not recorded yet'}`);
    assert(body1.data?.vitals === null || body1.data?.vitals?.bloodPressure?.display != null, 'Vitals are null or have real recorded values (zero fake fallbacks)');

    // 3. Test Recording Real Patient Vitals
    console.log('\n--- 3. Testing POST /api/patient/vitals ---');
    const vitalsPayload = {
      patient_id: 'PAT-93E5DD07',
      systolic: 124,
      diastolic: 82,
      pulse: 76,
      spo2: 98,
      temperature: 98.4,
      bloodSugar: 105,
      sugarType: 'FASTING',
      weight: 68,
      height: 172,
      notes: 'Recorded via Kiosk digital intake',
    };

    const vitalsRes = await fetch(`${BASE_URL}/api/patient/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vitalsPayload),
    });

    assert(vitalsRes.status === 201, `POST /api/patient/vitals returned 201 (Got ${vitalsRes.status})`);
    const vitalsBody = await vitalsRes.json();
    assert(vitalsBody.success === true, 'Vitals record success is true');
    assert(vitalsBody.data?.blood_pressure?.systolic === 124, 'Systolic BP saved as 124');
    assert(vitalsBody.data?.pulse?.value === 76, 'Pulse saved as 76');
    assert(vitalsBody.data?.bmi?.value === 23, `Auto-calculated BMI is 23 (Got: ${vitalsBody.data?.bmi?.value})`);
    assert(vitalsBody.data?.bmi?.status === 'Healthy', 'BMI status evaluated as Healthy');

    // 4. Verify Dashboard Immediately Reflects New Vitals
    console.log('\n--- 4. Verifying Dashboard Reflects Recorded Vitals ---');
    const res2 = await fetch(`${BASE_URL}/api/patient/dashboard?patient_id=PAT-93E5DD07`);
    const body2 = await res2.json();
    assert(body2.data?.vitals != null, 'Vitals now populated dynamically');
    assert(body2.data?.vitals?.bloodPressure?.display === '124/82 mmHg', 'BP display reflects: 124/82 mmHg');
    assert(body2.data?.vitals?.pulse?.value === 76, 'Pulse reflects: 76 bpm');
    assert(body2.data?.vitals?.oxygenSaturation?.value === 98, 'SpO2 reflects: 98%');
    assert(body2.data?.vitals?.bloodSugar?.value === 105, 'Blood sugar reflects: 105 mg/dL');
    assert(body2.data?.vitals?.bmi?.value === 23, 'BMI reflects: 23');
    assert(body2.data?.vitalsHistory?.length >= 1, 'Vitals history contains at least 1 record');

    // 5. Test Booking New Appointment
    console.log('\n--- 5. Testing POST /api/patient/appointments ---');
    const aptPayload = {
      patient_id: 'PAT-93E5DD07',
      doctorId: 'DOC-AYUS-02',
      doctorName: 'Dr. Aarav Mehta',
      doctorSpecialization: 'Yoga & Naturopathy (BNYS)',
      consultationType: 'IN_PERSON',
      date: new Date(Date.now() + 86400000).toISOString(),
      time: '11:00 AM',
      room: 'AYUSH OPD Room 204',
      reason: 'Lifestyle & Yogic Consultation',
    };

    const aptRes = await fetch(`${BASE_URL}/api/patient/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aptPayload),
    });

    assert(aptRes.status === 201, `POST /api/patient/appointments returned 201 (Got ${aptRes.status})`);
    const aptBody = await aptRes.json();
    assert(aptBody.success === true, 'Appointment creation success is true');
    assert(aptBody.data?.doctor_name === 'Dr. Aarav Mehta', 'Doctor name is Dr. Aarav Mehta');

    // 6. Verify Dashboard Reflects New Appointment
    console.log('\n--- 6. Verifying Dashboard Reflects Upcoming Appointment ---');
    const res3 = await fetch(`${BASE_URL}/api/patient/dashboard?patient_id=PAT-93E5DD07`);
    const body3 = await res3.json();
    assert(body3.data?.appointments?.upcoming?.length >= 1, 'Upcoming appointments list has at least 1 appointment');
    assert(body3.data?.counters?.upcomingAppointments >= 1, 'Upcoming appointments counter dynamically updated');
    const firstApt = body3.data?.appointments?.upcoming[0];
    assert(firstApt.doctorName === 'Dr. Aarav Mehta', 'Doctor name in dashboard matches Dr. Aarav Mehta');
    assert(firstApt.room === 'AYUSH OPD Room 204', 'Room matches AYUSH OPD Room 204');

    // 7. Verify Data Isolation (Patient A vs Patient B)
    console.log('\n--- 7. Verifying Cross-Patient Data Isolation ---');
    const resB = await fetch(`${BASE_URL}/api/patient/dashboard?patient_id=PAT-8325371F`);
    assert(resB.status === 200, 'GET /api/patient/dashboard for Patient B returned 200');
    const bodyB = await resB.json();
    assert(bodyB.data?.patient?.id === 'PAT-8325371F', 'Patient B ID matches PAT-8325371F');
    assert(bodyB.data?.patient?.opdType === 'GENERAL', 'Patient B is GENERAL OPD (not AYUSH)');
    assert(bodyB.data?.patient?.opdSystem === 'MODERN_MEDICINE', 'Patient B OPD system is MODERN_MEDICINE');
    assert(bodyB.data?.appointments?.upcoming?.length === 0, 'Patient B has 0 upcoming appointments (Patient A appointment not leaked!)');

    // 8. Test Error Handling (Invalid Patient ID)
    console.log('\n--- 8. Testing Error Handling & Missing Patient ---');
    const resErr = await fetch(`${BASE_URL}/api/patient/dashboard?patient_id=NON_EXISTENT_ID`);
    assert(resErr.status === 404, `Invalid patient returned 404 Not Found (Got ${resErr.status})`);

    const resMissing = await fetch(`${BASE_URL}/api/patient/dashboard`);
    assert(resMissing.status === 400, `Missing patient ID returned 400 Bad Request (Got ${resMissing.status})`);

    console.log('\n========================================================');
    console.log(`🎉 ALL TESTS COMPLETED: ${passed} passed, ${failed} failed.`);
    console.log('========================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  }
}

runTests();
