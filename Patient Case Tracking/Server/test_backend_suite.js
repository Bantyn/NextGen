import app from './src/app.js';
import mongoose from 'mongoose';

const TEST_PORT = 5055;

async function runTests() {
  console.log('🚀 Starting MediKiosk Backend Engineering Test Suite...');

  const server = app.listen(TEST_PORT, '127.0.0.1');

  // Wait for MongoDB connection
  let retries = 10;
  while (mongoose.connection.readyState !== 1 && retries > 0) {
    console.log('Waiting for MongoDB connection...');
    await new Promise((r) => setTimeout(r, 500));
    retries--;
  }

  const baseUrl = `http://127.0.0.1:${TEST_PORT}/api/v1`;
  let adminToken = '';
  let doctorToken = '';
  let patientId = '';
  let sessionId = '';
  let recordId = '';

  try {
    // 1. Health Check
    console.log('\n--- Test 1: GET /api/v1/health ---');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log('Health Status:', healthRes.status, healthData);
    if (healthRes.status !== 200 || healthData.status !== 'success') throw new Error('Health check failed');

    // 2. Auth Register (Admin)
    console.log('\n--- Test 2: POST /api/v1/auth/register (Admin) ---');
    const adminEmail = `admin-${Date.now()}@medikiosk.ai`;
    const regAdminRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Chief Administrator',
        email: adminEmail,
        password: 'AdminPassword123!',
        phone: '+919999900001',
        role: 'ADMIN',
      }),
    });
    const regAdminData = await regAdminRes.json();
    console.log('Register Admin Status:', regAdminRes.status, regAdminData.success);
    if (!regAdminData.success) throw new Error(`Admin registration failed: ${JSON.stringify(regAdminData)}`);
    adminToken = regAdminData.data.token;

    // 3. Auth Register (Doctor)
    console.log('\n--- Test 3: POST /api/v1/auth/register (Doctor) ---');
    const docEmail = `doctor-${Date.now()}@medikiosk.ai`;
    const regDocRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Priya Sharma',
        email: docEmail,
        password: 'DoctorPassword123!',
        phone: '+919876543211',
        role: 'DOCTOR',
      }),
    });
    const regDocData = await regDocRes.json();
    console.log('Register Doctor Status:', regDocRes.status, regDocData.success);
    if (!regDocData.success) throw new Error('Doctor registration failed');
    doctorToken = regDocData.data.token;

    // 4. Auth Login
    console.log('\n--- Test 4: POST /api/v1/auth/login ---');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: docEmail,
        password: 'DoctorPassword123!',
      }),
    });
    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status, loginData.success);
    if (!loginData.success) throw new Error('Login failed');

    // 5. Auth /me
    console.log('\n--- Test 5: GET /api/v1/auth/me ---');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const meData = await meRes.json();
    console.log('Me Status:', meRes.status, meData.data.name, meData.data.role);
    if (meData.data.role !== 'DOCTOR') throw new Error('Auth /me role mismatch');

    // 6. Users List (Admin Scope)
    console.log('\n--- Test 6: GET /api/v1/users (Admin Scope) ---');
    const usersRes = await fetch(`${baseUrl}/users?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = await usersRes.json();
    console.log('Users List Status:', usersRes.status, 'Total:', usersData.data.length);
    if (usersRes.status !== 200) throw new Error('Users list failed');

    // 7. Patient Registration
    console.log('\n--- Test 7: POST /api/v1/patients ---');
    const patRes = await fetch(`${baseUrl}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'Rajesh',
        last_name: 'Patel',
        phone: '+919876543210',
        gender: 'MALE',
        address: 'Ahmedabad, Gujarat',
        emergency_contact: {
          name: 'Sunita Patel',
          phone: '+919876543219',
          relationship: 'Spouse',
        },
      }),
    });
    const patData = await patRes.json();
    console.log('Patient Created Status:', patRes.status, patData.data.patient_id);
    if (!patData.success) throw new Error('Patient creation failed');
    patientId = patData.data.patient_id;

    // 8. Patient Search
    console.log('\n--- Test 8: GET /api/v1/patients?search=9876543210 ---');
    const patSearchRes = await fetch(`${baseUrl}/patients?search=9876543210`);
    const patSearchData = await patSearchRes.json();
    console.log('Patient Search Found:', patSearchData.data.length);
    if (patSearchData.data.length === 0) throw new Error('Patient search returned no results');

    // 9. Patient Identity Attach (ABHA)
    console.log('\n--- Test 9: POST /api/v1/patients/:id/identities ---');
    const idRes = await fetch(`${baseUrl}/patients/${patientId}/identities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity_type: 'ABHA',
        identity_reference: '91-1234-5678-9012',
        verification_status: 'VERIFIED',
      }),
    });
    const idData = await idRes.json();
    console.log('Identity Attached:', idData.success, idData.data.identity_type);
    if (!idData.success) throw new Error('Identity attach failed');

    // 10. Consent Grant
    console.log('\n--- Test 10: POST /api/v1/consents ---');
    const consentRes = await fetch(`${baseUrl}/consents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        consent_type: 'AI_CASE_TAKING',
        status: 'GRANTED',
      }),
    });
    const consentData = await consentRes.json();
    console.log('Consent Granted:', consentData.success, consentData.data.status);
    if (!consentData.success) throw new Error('Consent grant failed');

    // 11. Clinical Session Init
    console.log('\n--- Test 11: POST /api/v1/sessions ---');
    const sessRes = await fetch(`${baseUrl}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        language: 'gu-IN',
        consultation_type: 'AYUSH_AYURVEDA',
        chief_complaint_category: 'CHEST_PAIN',
      }),
    });
    const sessData = await sessRes.json();
    console.log('Session Initialized:', sessData.success, sessData.data.session_id);
    if (!sessData.success) throw new Error('Session init failed');
    sessionId = sessData.data.session_id;

    // 12. Active Sessions List
    console.log('\n--- Test 12: GET /api/v1/sessions/active ---');
    const activeRes = await fetch(`${baseUrl}/sessions/active`);
    const activeData = await activeRes.json();
    console.log('Active Sessions Count:', activeData.data.length);
    if (activeData.data.length === 0) throw new Error('Active sessions list empty');

    // 13. Case Dialogue Message Post
    console.log('\n--- Test 13: POST /api/v1/case-messages ---');
    const msgRes = await fetch(`${baseUrl}/case-messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        sender: 'PATIENT',
        message: 'Mane chhati ma dukhavo thay chhe 3 divas thi.',
        message_type: 'TEXT',
      }),
    });
    const msgData = await msgRes.json();
    console.log('Case Message Posted:', msgData.success, msgData.data.message);
    if (!msgData.success) throw new Error('Message post failed');

    // 14. Clinical Observations Post
    console.log('\n--- Test 14: POST /api/v1/observations ---');
    const obsRes = await fetch(`${baseUrl}/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        category: 'SYMPTOM',
        name: 'Chest Pain',
        value: 'Moderate retrosternal radiating',
        unit: '3 Days',
        confidence: 0.95,
        source: 'AI_DIALOGUE',
      }),
    });
    const obsData = await obsRes.json();
    console.log('Observation Stored:', obsData.success, obsData.data.name);
    if (!obsData.success) throw new Error('Observation store failed');

    // 15. Record Draft Synthesis
    console.log('\n--- Test 15: POST /api/v1/records/generate ---');
    const recRes = await fetch(`${baseUrl}/records/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        session_id: sessionId,
      }),
    });
    const recData = await recRes.json();
    console.log('Draft Record Synthesized:', recData.success, recData.data.record_id);
    if (!recData.success) throw new Error('Draft record generation failed');
    recordId = recData.data.record_id;

    // 16. Doctor Review & Approval
    console.log('\n--- Test 16: PUT /api/v1/records/:id/review ---');
    const revRes = await fetch(`${baseUrl}/records/${recordId}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        review_status: 'APPROVED',
        doctor_notes: 'Advised immediate ECG and Troponin test. Prescribed Arjuna Ksheerapaka.',
        physician_prescription: [
          {
            medicine_name: 'Arjuna Churna',
            dosage: '3g',
            frequency: 'Twice daily with milk',
            duration: '15 days',
          },
        ],
      }),
    });
    const revData = await revRes.json();
    console.log('Review Finalized:', revData.success, revData.data.review_status);
    if (revData.data.review_status !== 'APPROVED') throw new Error('Record approval failed');

    // 17. Patient Record History
    console.log('\n--- Test 17: GET /api/v1/records/patient/:patientId ---');
    const histRes = await fetch(`${baseUrl}/records/patient/${patientId}`);
    const histData = await histRes.json();
    console.log('Patient Records History Count:', histData.data.length);
    if (histData.data.length === 0) throw new Error('Patient record history empty');

    // 18. Smart Assistant Quick Actions
    console.log('\n--- Test 18: GET /api/v1/assistant/quick-actions ---');
    const qaRes = await fetch(`${baseUrl}/assistant/quick-actions`);
    const qaData = await qaRes.json();
    console.log('Assistant Quick Actions:', qaData.data?.categories?.length || qaData.status);

    console.log('\n======================================================');
    console.log('✅ ALL 18 BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
    console.log('Server and DB connection closed cleanly.');
  }
}

runTests();
