import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../utils/db.js';
import { ClinicalSession } from '../models/ClinicalSession.js';
import { ClinicalRecord } from '../models/ClinicalRecord.js';
import { CaseMessage } from '../models/CaseMessage.js';
import { MedicalDocument } from '../models/MedicalDocument.js';
import { RedFlagCase } from '../models/RedFlagCase.js';
import { Patient } from '../models/Patient.js';

async function check() {
  await connectDB();
  const sid = 'SES-MU1OCL9D-J2FJT';
  console.log('Checking session:', sid);
  
  const sess = await ClinicalSession.findOne({ 
    $or: [
      { session_id: sid },
      { session_id: new RegExp('^' + sid + '$', 'i') }
    ]
  });
  console.log('ClinicalSession found:', sess ? { 
    id: sess.session_id, 
    patient_id: sess.patient_id, 
    status: sess.status,
    clinical_state: sess.clinical_state,
    clinical_summary: sess.clinical_summary,
    assigned_doctor_id: sess.assigned_doctor_id
  } : null);

  const rf = await RedFlagCase.findOne({
    $or: [
      { case_id: sid },
      { clinical_session_id: sid }
    ]
  });
  console.log('RedFlagCase found:', rf ? { case_id: rf.case_id, session_id: rf.clinical_session_id, patient_id: rf.patient_id } : null);

  const pid = sess?.patient_id || rf?.patient_id;
  if (pid) {
    console.log('Associated Patient ID:', pid);
    const pat = await Patient.findOne({ patient_id: pid });
    console.log('Patient record:', pat ? { id: pat.patient_id, name: `${pat.first_name} ${pat.last_name}`, phone: pat.phone, dob: pat.date_of_birth, gender: pat.gender } : null);
    
    const docs = await MedicalDocument.find({ $or: [{ session_id: sid }, { patient_id: pid }] });
    console.log('Medical Documents count:', docs.length);
    docs.forEach(d => console.log(' Doc:', d.document_id, d.file_name, d.session_id, d.patient_id));

    const msgs = await CaseMessage.find({ session_id: sid });
    console.log('Case Messages count:', msgs.length);
    msgs.forEach(m => console.log(' Msg:', m.sender, m.content?.slice(0, 40)));

    const recs = await ClinicalRecord.find({ $or: [{ session_id: sid }, { patient_id: pid }] });
    console.log('Clinical Records count:', recs.length);
    recs.forEach(r => console.log(' Rec:', r.record_id, r.session_id, r.physician_prescription));
  } else {
    console.log('Session not found directly. Searching recent sessions:');
    const recents = await ClinicalSession.find().sort({ createdAt: -1 }).limit(5);
    console.log('Recent sessions:', recents.map(s => ({ id: s.session_id, pid: s.patient_id, created: s.createdAt })));
  }
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
