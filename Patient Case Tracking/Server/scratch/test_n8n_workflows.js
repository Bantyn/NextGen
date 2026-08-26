const http = require('http');

function postJSON(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5678,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, rawBody: body });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting MediKiosk n8n Workflows Test Suite...\n');

  // Test 1: Workflow 1 (AI Case-Taking)
  console.log('▶️ Testing Workflow 1: POST /webhook-test/medikiosk-case-taking');
  try {
    const res1 = await postJSON('/webhook-test/medikiosk-case-taking', {
      session_id: 'test-session-001',
      patient_id: 'test-patient-001',
      question_id: 'q_01',
      patient_answer: 'I have severe chest pain and breathlessness.',
      language: 'English',
    });
    console.log('Result 1 (Status', res1.statusCode, '):', JSON.stringify(res1.data || res1.rawBody, null, 2));
  } catch (err) {
    console.log('⚠️ Workflow 1 Error (n8n Webhook listening?):', err.message);
  }

  console.log('\n--------------------------------------------------\n');

  // Test 2: Workflow 2 (Document Processing)
  console.log('▶️ Testing Workflow 2: POST /webhook-test/medikiosk-document-processing');
  try {
    const res2 = await postJSON('/webhook-test/medikiosk-document-processing', {
      document_id: 'test-doc-001',
      file_name: 'prescription.png',
      file_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mime_type: 'image/png',
    });
    console.log('Result 2 (Status', res2.statusCode, '):', JSON.stringify(res2.data || res2.rawBody, null, 2));
  } catch (err) {
    console.log('⚠️ Workflow 2 Error (n8n Webhook listening?):', err.message);
  }

  console.log('\n--------------------------------------------------\n');

  // Test 3: Workflow 3 (Clinical Summary)
  console.log('▶️ Testing Workflow 3: POST /webhook-test/medikiosk-clinical-summary');
  try {
    const res3 = await postJSON('/webhook-test/medikiosk-clinical-summary', {
      session_id: 'test-session-001',
      patient_id: 'test-patient-001',
      case_completed: true,
    });
    console.log('Result 3 (Status', res3.statusCode, '):', JSON.stringify(res3.data || res3.rawBody, null, 2));
  } catch (err) {
    console.log('⚠️ Workflow 3 Error (n8n Webhook listening?):', err.message);
  }
}

runTests();
