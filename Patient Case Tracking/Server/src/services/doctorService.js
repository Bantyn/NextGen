import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { ClinicalSession } from '../models/ClinicalSession.js';
import { User } from '../models/User.js';
import clinicalIntelligenceService from './clinicalIntelligenceService.js';

/**
 * Verified Sehat Hospital Specialist Directory
 * Ground-truth clinical roster mapped to OPD wings, rooms, and consultation schedules.
 */
const VERIFIED_DOCTORS_DIRECTORY = [
  {
    doctor_id: 'DOC-DERM-01',
    doctor_name: 'Dr. Ananya Sen',
    qualification: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
    specialty: 'Dermatology',
    sub_specialty: 'Clinical Dermatology & Cutaneous Allergies',
    department: 'Department of Dermatology & Skin Care',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 204 (Wing B, 2nd Floor)',
    experience_years: 12,
    consultation_type: 'GENERAL',
    languages: ['English', 'Hindi', 'Gujarati'],
    days_active: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shift: { start: '09:00', end: '18:00', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 15,
    fixed_slots: ['09:30 AM', '10:15 AM', '11:30 AM', '02:30 PM', '04:00 PM', '05:00 PM', '05:30 PM'],
  },
  {
    doctor_id: 'DOC-MED-01',
    doctor_name: 'Dr. Priya Sharma',
    qualification: 'MBBS, MD (Internal Medicine), FICP',
    specialty: 'General Medicine',
    sub_specialty: 'Adult Internal Medicine & Infectious Diseases',
    department: 'Department of General Internal Medicine',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 102 (Main OPD Block, 1st Floor)',
    experience_years: 15,
    consultation_type: 'GENERAL',
    languages: ['English', 'Hindi', 'Gujarati'],
    days_active: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shift: { start: '08:30', end: '17:30', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 15,
    fixed_slots: ['09:00 AM', '10:00 AM', '11:15 AM', '02:00 PM', '03:30 PM', '04:45 PM'],
  },
  {
    doctor_id: 'DOC-CARD-01',
    doctor_name: 'Dr. Arvind Joshi',
    qualification: 'MBBS, MD (Med), DM (Cardiology), FACC',
    specialty: 'Cardiology',
    sub_specialty: 'Interventional Cardiology & Coronary Care',
    department: 'Department of Cardiology & Cardiac Care',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 305 (Cardiac Center, 3rd Floor)',
    experience_years: 18,
    consultation_type: 'GENERAL',
    languages: ['English', 'Hindi', 'Gujarati'],
    days_active: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    shift: { start: '09:00', end: '17:00', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 20,
    fixed_slots: ['10:00 AM', '11:30 AM', '02:30 PM', '04:15 PM'],
  },
  {
    doctor_id: 'DOC-NEUR-01',
    doctor_name: 'Dr. Meera Kulkarni',
    qualification: 'MBBS, MD, DM (Neurology)',
    specialty: 'Neurology',
    sub_specialty: 'Headache Disorders, Migraine & Stroke Management',
    department: 'Department of Neurosciences',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 308 (Neurosciences Wing, 3rd Floor)',
    experience_years: 14,
    consultation_type: 'GENERAL',
    languages: ['English', 'Hindi', 'Marathi'],
    days_active: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shift: { start: '09:30', end: '17:30', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 20,
    fixed_slots: ['10:15 AM', '11:45 AM', '02:45 PM', '04:30 PM', '05:00 PM'],
  },
  {
    doctor_id: 'DOC-ORTH-01',
    doctor_name: 'Dr. Kirit Patel',
    qualification: 'MBBS, MS (Orthopedics), M.Ch (Ortho)',
    specialty: 'Orthopedics',
    sub_specialty: 'Joint Replacement & Musculoskeletal Trauma',
    department: 'Department of Orthopedic Surgery',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 104 (Surgical Block, 1st Floor)',
    experience_years: 16,
    consultation_type: 'GENERAL',
    languages: ['English', 'Hindi', 'Gujarati'],
    days_active: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shift: { start: '09:00', end: '18:00', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 15,
    fixed_slots: ['09:45 AM', '11:00 AM', '03:00 PM', '04:15 PM', '05:15 PM'],
  },
  {
    doctor_id: 'DOC-AYUS-01',
    doctor_name: 'Dr. Harish Vyas',
    qualification: 'BAMS, MD (Ayurveda - Kayachikitsa)',
    specialty: 'Ayurveda',
    sub_specialty: 'Ayurvedic Kayachikitsa & Panchakarma',
    department: 'Department of Ayurveda & Integrative Medicine',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 106 (AYUSH Block C, 1st Floor)',
    experience_years: 20,
    consultation_type: 'AYUSH_AYURVEDA',
    languages: ['English', 'Hindi', 'Gujarati', 'Sanskrit'],
    days_active: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shift: { start: '09:00', end: '17:00', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 20,
    fixed_slots: ['09:30 AM', '10:45 AM', '02:30 PM', '04:00 PM'],
  },
  {
    doctor_id: 'DOC-AYUS-02',
    doctor_name: 'Dr. Aarav Mehta',
    qualification: 'BNYS (Naturopathy & Yogic Sciences)',
    specialty: 'Yoga & Naturopathy',
    sub_specialty: 'Therapeutic Yoga & Clinical Naturopathy',
    department: 'Department of Yoga & Naturopathy',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 108 (AYUSH Block C, 1st Floor)',
    experience_years: 12,
    consultation_type: 'AYUSH_YOGA_NATUROPATHY',
    languages: ['English', 'Hindi', 'Gujarati'],
    days_active: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shift: { start: '08:30', end: '16:30', break_start: '12:30', break_end: '13:30' },
    slot_duration_mins: 25,
    fixed_slots: ['09:00 AM', '10:30 AM', '02:00 PM', '03:30 PM'],
  },
  {
    doctor_id: 'DOC-AYUS-03',
    doctor_name: 'Dr. Tariq Hakim',
    qualification: 'BUMS, MD (Unani Medicine)',
    specialty: 'Unani',
    sub_specialty: 'Ilaj-bil-Tadbeer & Herbal Formulations',
    department: 'Department of Unani Medicine',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 110 (AYUSH Block C, 1st Floor)',
    experience_years: 15,
    consultation_type: 'AYUSH_UNANI',
    languages: ['English', 'Hindi', 'Urdu', 'Gujarati'],
    days_active: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    shift: { start: '09:00', end: '17:00', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 20,
    fixed_slots: ['10:00 AM', '11:30 AM', '03:00 PM', '04:30 PM'],
  },
  {
    doctor_id: 'DOC-AYUS-04',
    doctor_name: 'Dr. S. Murugan',
    qualification: 'BSMS, MD (Siddha Maruthuvam)',
    specialty: 'Siddha',
    sub_specialty: 'Siddha Mineral-Herb Therapy & Varmam',
    department: 'Department of Siddha Medicine',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 112 (AYUSH Block C, 1st Floor)',
    experience_years: 17,
    consultation_type: 'AYUSH_SIDDHA',
    languages: ['English', 'Tamil', 'Hindi'],
    days_active: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shift: { start: '09:00', end: '17:00', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 20,
    fixed_slots: ['09:45 AM', '11:15 AM', '02:45 PM', '04:15 PM'],
  },
  {
    doctor_id: 'DOC-AYUS-05',
    doctor_name: 'Dr. Rohini Sen',
    qualification: 'BHMS, MD (Homoeopathy)',
    specialty: 'Homoeopathy',
    sub_specialty: 'Constitutional Homoeopathy & Chronic Diseases',
    department: 'Department of Homoeopathy',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 114 (AYUSH Block C, 1st Floor)',
    experience_years: 14,
    consultation_type: 'AYUSH_HOMOEOPATHY',
    languages: ['English', 'Hindi', 'Bengali', 'Gujarati'],
    days_active: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shift: { start: '09:30', end: '17:30', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 20,
    fixed_slots: ['10:00 AM', '11:45 AM', '03:15 PM', '04:45 PM'],
  },
  {
    doctor_id: 'DOC-AYUS-06',
    doctor_name: 'Dr. Tenzin Norbu',
    qualification: 'Menrampa (MD Sowa-Rigpa)',
    specialty: 'Sowa-Rigpa',
    sub_specialty: 'Traditional Himalayan Medicine & Pulse Examination',
    department: 'Department of Sowa-Rigpa & Himalayan Healing',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 116 (AYUSH Block C, 1st Floor)',
    experience_years: 19,
    consultation_type: 'AYUSH_SOWA_RIGPA',
    languages: ['English', 'Hindi', 'Tibetan'],
    days_active: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    shift: { start: '10:00', end: '17:00', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 25,
    fixed_slots: ['10:30 AM', '11:30 AM', '02:30 PM', '04:00 PM'],
  },
  {
    doctor_id: 'DOC-GAST-01',
    doctor_name: 'Dr. Vikram Rathod',
    qualification: 'MBBS, MD, DM (Gastroenterology)',
    specialty: 'Gastroenterology',
    sub_specialty: 'Digestive Diseases & Therapeutic Endoscopy',
    department: 'Department of Gastroenterology & Hepatology',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 210 (Wing B, 2nd Floor)',
    experience_years: 13,
    consultation_type: 'GENERAL',
    languages: ['English', 'Hindi', 'Gujarati'],
    days_active: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
    shift: { start: '09:00', end: '17:00', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 20,
    fixed_slots: ['10:00 AM', '11:30 AM', '03:15 PM', '04:30 PM'],
  },
  {
    doctor_id: 'DOC-PULM-01',
    doctor_name: 'Dr. Rakesh Parikh',
    qualification: 'MBBS, MD (Pulmonary Medicine), DTCD',
    specialty: 'Pulmonology',
    sub_specialty: 'Asthma, COPD & Respiratory Critical Care',
    department: 'Department of Pulmonary & Chest Medicine',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 214 (Chest Clinic, 2nd Floor)',
    experience_years: 17,
    consultation_type: 'GENERAL',
    languages: ['English', 'Hindi', 'Gujarati'],
    days_active: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
    shift: { start: '09:00', end: '17:30', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 15,
    fixed_slots: ['09:30 AM', '11:00 AM', '02:45 PM', '04:15 PM', '05:00 PM'],
  },
  {
    doctor_id: 'DOC-ENT-01',
    doctor_name: 'Dr. Sneha Desai',
    qualification: 'MBBS, MS (ENT / Otorhinolaryngology)',
    specialty: 'ENT',
    sub_specialty: 'Ear, Nose, Throat & Sinus Disorders',
    department: 'Department of ENT & Head-Neck Surgery',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 208 (Wing A, 2nd Floor)',
    experience_years: 11,
    consultation_type: 'GENERAL',
    languages: ['English', 'Hindi', 'Gujarati'],
    days_active: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shift: { start: '09:00', end: '17:00', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 15,
    fixed_slots: ['10:00 AM', '11:30 AM', '02:30 PM', '04:30 PM'],
  },
  {
    doctor_id: 'DOC-OPHT-01',
    doctor_name: 'Dr. Sanjay Bhatt',
    qualification: 'MBBS, MS (Ophthalmology)',
    specialty: 'Ophthalmology',
    sub_specialty: 'Comprehensive Eye Care & Cornea',
    department: 'Department of Ophthalmology & Eye Clinic',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 112 (Eye Center, 1st Floor)',
    experience_years: 19,
    consultation_type: 'GENERAL',
    languages: ['English', 'Hindi', 'Gujarati'],
    days_active: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
    shift: { start: '09:00', end: '16:30', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 15,
    fixed_slots: ['09:30 AM', '11:00 AM', '02:15 PM', '03:45 PM'],
  },
  {
    doctor_id: 'DOC-DENT-01',
    doctor_name: 'Dr. Nidhi Shah',
    qualification: 'BDS, MDS (Conservative Dentistry & Endodontics)',
    specialty: 'Dentistry',
    sub_specialty: 'Oral Medicine & Endodontics',
    department: 'Department of Dental Surgery',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 114 (Dental Wing, 1st Floor)',
    experience_years: 9,
    consultation_type: 'GENERAL',
    languages: ['English', 'Hindi', 'Gujarati'],
    days_active: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shift: { start: '09:30', end: '17:30', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 20,
    fixed_slots: ['10:00 AM', '11:45 AM', '03:00 PM', '04:30 PM'],
  },
  {
    doctor_id: 'DOC-PSYC-01',
    doctor_name: 'Dr. Amit Dave',
    qualification: 'MBBS, MD (Psychiatry)',
    specialty: 'Psychiatry',
    sub_specialty: 'Adult Psychiatry, Anxiety & Mood Disorders',
    department: 'Department of Psychiatry & Mental Health',
    hospital: 'Sehat Apex Civil Hospital',
    room: 'Room 312 (Behavioral Health, 3rd Floor)',
    experience_years: 13,
    consultation_type: 'GENERAL',
    languages: ['English', 'Hindi', 'Gujarati'],
    days_active: ['Monday', 'Wednesday', 'Thursday', 'Friday'],
    shift: { start: '10:00', end: '17:00', break_start: '13:00', break_end: '14:00' },
    slot_duration_mins: 30,
    fixed_slots: ['10:30 AM', '11:30 AM', '02:30 PM', '04:00 PM'],
  },
];

/**
 * Doctor & Specialist Service
 * Real-time clinical routing, schedule queries, and live OPD queue calculation.
 */
export class DoctorService {
  /**
   * Fetch all registered doctors dynamically from MongoDB User collection
   */
  async getDoctorsFromDB() {
    try {
      if (mongoose.connection?.readyState !== 1) {
        return [];
      }
      const dbUsers = await User.find({
        role: { $in: ['DOCTOR', 'doctor'] },
        is_active: { $ne: false },
      }).lean();

      return (dbUsers || []).map((u) => {
        const docId = u.doctor_id || u._id.toString();
        const docName = u.name?.startsWith('Dr.') || u.name?.startsWith('Vaidya')
          ? u.name
          : (u.opd_type === 'AYUSH' ? `Vaidya ${u.name}` : `Dr. ${u.name}`);
        const isAyush = u.opd_type === 'AYUSH';
        const docSpec = u.specialty || (isAyush ? 'Ayurveda' : 'General Medicine');
        const docQual = u.qualification || (isAyush ? 'BAMS, MD (Ayurveda)' : 'MBBS, MD (General Medicine)');
        const docRoom = u.room || (isAyush ? 'Room 201 (AYUSH Wing)' : 'Room 104 (Main OPD)');
        const docDept = u.department || (isAyush ? 'Department of AYUSH & Integrative Medicine' : 'Department of General Internal Medicine');

        return {
          doctor_id: docId,
          id: docId,
          doctor_name: docName,
          name: docName,
          qualification: docQual,
          specialty: docSpec,
          sub_specialty: u.sub_specialty || docSpec,
          department: docDept,
          hospital: 'Sehat Apex Civil Hospital',
          room: docRoom,
          experience_years: u.experience_years || 12,
          consultation_type: isAyush ? (u.opd_system ? `AYUSH_${u.opd_system}` : 'AYUSH_AYURVEDA') : 'GENERAL',
          opd_type: u.opd_type || 'GENERAL',
          opd_system: u.opd_system || (isAyush ? 'AYURVEDA' : 'GENERAL_MEDICINE'),
          languages: ['English', 'Hindi', 'Gujarati'],
          days_active: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          shift: { start: '09:00', end: '18:00', break_start: '13:00', break_end: '14:00' },
          slot_duration_mins: 15,
          fixed_slots: ['09:30 AM', '10:30 AM', '11:30 AM', '02:30 PM', '04:00 PM', '05:00 PM'],
          on_duty: u.on_duty !== false,
          availability_status: u.availability_status || 'AVAILABLE',
          is_from_db: true,
        };
      });
    } catch (err) {
      logger.warn('[DoctorService] Failed to load doctors from User collection:', err.message);
      return [];
    }
  }

  /**
   * Automatically match and allot a doctor from the MongoDB User collection based on symptoms and OPD mode
   */
  async allotDoctorForPatient({ symptoms = [], chiefComplaint = '', opdType = 'GENERAL', opdSystem = '' } = {}) {
    const dbDocs = await this.getDoctorsFromDB();
    const isAyush = opdType === 'AYUSH';

    const symptomsList = Array.isArray(symptoms) ? symptoms : [symptoms];
    const combinedText = [...symptomsList, chiefComplaint].filter(Boolean).join(' ');

    const specialtyMatch = clinicalIntelligenceService.matchSpecialtyFromSymptoms(combinedText, '');
    const targetSpecialty = specialtyMatch?.primary || (isAyush ? 'Ayurveda' : 'General Medicine');
    const candidates = (specialtyMatch?.candidates || [targetSpecialty]).map((c) => c.toLowerCase());

    logger.info(`[DoctorService] Allotting doctor for symptoms "${combinedText.slice(0, 50)}..." -> Target Specialty: ${targetSpecialty}, OPD Type: ${opdType}`);

    // If doctors exist in database, prioritize DB doctors
    if (dbDocs.length > 0) {
      // 1. Filter by OPD mode if relevant
      const opdMatchedDocs = dbDocs.filter((d) => {
        if (isAyush) return d.opd_type === 'AYUSH';
        return d.opd_type !== 'AYUSH';
      });

      const pool = opdMatchedDocs.length > 0 ? opdMatchedDocs : dbDocs;

      // 2. Specialty match based on clinical intelligence symptoms
      let bestMatch = pool.find((d) => {
        const spec = (d.specialty || '').toLowerCase();
        const subSpec = (d.sub_specialty || '').toLowerCase();
        const dept = (d.department || '').toLowerCase();
        return candidates.some((cand) => spec.includes(cand) || subSpec.includes(cand) || dept.includes(cand));
      });

      // 3. Fallback to General OPD / General Medicine or first available doctor
      if (!bestMatch) {
        bestMatch = pool.find((d) => {
          const spec = (d.specialty || '').toLowerCase();
          return spec.includes('general') || spec.includes('opd') || spec.includes('internal');
        });
      }

      if (!bestMatch) {
        bestMatch = pool[0];
      }

      if (bestMatch) {
        logger.info(`[DoctorService] Successfully allotted DB Doctor: ${bestMatch.doctor_name} (${bestMatch.doctor_id})`);
        return {
          doctorId: bestMatch.doctor_id,
          doctorName: bestMatch.doctor_name,
          specialization: bestMatch.specialty,
          qualification: bestMatch.qualification,
          department: bestMatch.department,
          room: bestMatch.room,
          opdType: bestMatch.opd_type || opdType,
        };
      }
    }

    // Fallback to verified roster if no doctors found in DB
    const directoryDocs = VERIFIED_DOCTORS_DIRECTORY;
    let fallbackMatch = directoryDocs.find((d) => {
      const spec = d.specialty.toLowerCase();
      return candidates.some((cand) => spec.includes(cand));
    });

    if (!fallbackMatch && isAyush) {
      fallbackMatch = directoryDocs.find((d) => (d.consultation_type || '').startsWith('AYUSH'));
    }
    if (!fallbackMatch) {
      fallbackMatch = directoryDocs.find((d) => d.doctor_id === 'DOC-MED-01') || directoryDocs[0];
    }

    return {
      doctorId: fallbackMatch.doctor_id,
      doctorName: fallbackMatch.doctor_name,
      specialization: fallbackMatch.specialty,
      qualification: fallbackMatch.qualification,
      department: fallbackMatch.department,
      room: fallbackMatch.room,
      opdType: isAyush ? 'AYUSH' : 'GENERAL',
    };
  }

  /**
   * Return verified roster of doctors
   */
  getAllDoctors() {
    return VERIFIED_DOCTORS_DIRECTORY;
  }

  /**
   * Find doctors matching specific medical specialty
   */
  getDoctorsBySpecialty(specialty) {
    if (!specialty) return [];
    const clean = specialty.trim().toLowerCase();
    return VERIFIED_DOCTORS_DIRECTORY.filter(
      (d) =>
        d.specialty.toLowerCase().includes(clean) ||
        clean.includes(d.specialty.toLowerCase()) ||
        d.sub_specialty.toLowerCase().includes(clean)
    );
  }

  /**
   * Compute live OPD Queue length and wait time for a given department
   */
  async getLiveQueueStatus(departmentOrSpecialty = '') {
    const clean = (departmentOrSpecialty || '').trim().toLowerCase();
    let activePatientsCount = 3; // Realistic baseline simulation

    if (mongoose.connection?.readyState === 1) {
      try {
        const activeCount = await ClinicalSession.countDocuments({
          status: {
            $in: [
              'STARTED',
              'IDENTIFIED',
              'IN_PROGRESS',
              'HISTORY_IN_PROGRESS',
              'DOCUMENT_PROCESSING',
              'PRIORITY_TRIAGE',
              'READY_FOR_DOCTOR',
            ],
          },
        });
        if (typeof activeCount === 'number' && activeCount >= 0) {
          activePatientsCount = Math.max(1, activeCount);
        }
      } catch (err) {
        // Fallback to baseline
      }
    }

    const estimatedWaitMinutes = Math.min(60, Math.max(5, activePatientsCount * 8));

    return {
      active_queue_count: activePatientsCount,
      estimated_wait_minutes: estimatedWaitMinutes,
      wait_time_display: `${estimatedWaitMinutes} mins`,
      queue_status: activePatientsCount > 6 ? 'BUSY' : activePatientsCount > 3 ? 'MODERATE' : 'FAST',
    };
  }

  /**
   * Compute live availability for a doctor on a specific date / time
   * @param {object} doctor
   * @param {object} options - { targetDate, targetTimeStr }
   */
  async calculateDoctorAvailability(doctor, options = {}) {
    const now = new Date();
    const targetDate = options.targetDate ? new Date(options.targetDate) : now;
    const requestedTime = options.targetTimeStr ? options.targetTimeStr.trim().toLowerCase() : null;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[targetDate.getDay()];

    const isAvailableToday = doctor.days_active.includes(currentDayName);

    // Filter slots
    const allSlots = doctor.fixed_slots || ['10:00 AM', '11:30 AM', '02:30 PM', '04:00 PM', '05:00 PM'];
    let availableSlots = isAvailableToday ? [...allSlots] : [];

    // Check specific requested time (e.g., "5 PM", "17:00", "5:00 PM")
    let matchesRequestedTime = false;
    let matchingSlot = null;

    if (requestedTime && isAvailableToday) {
      const parsedHour = this.parseHourFromText(requestedTime);
      if (parsedHour !== null) {
        matchingSlot = availableSlots.find((slot) => {
          const slotHour = this.parseHourFromText(slot);
          return slotHour !== null && Math.abs(slotHour - parsedHour) <= 1;
        });
        matchesRequestedTime = Boolean(matchingSlot);
      }
    }

    // Determine next available slot
    const nextSlot = isAvailableToday && availableSlots.length > 0 ? availableSlots[0] : 'Tomorrow at 09:30 AM';

    const queueData = await this.getLiveQueueStatus(doctor.specialty);

    return {
      doctor_id: doctor.doctor_id,
      doctor_name: doctor.doctor_name,
      qualification: doctor.qualification,
      specialty: doctor.specialty,
      sub_specialty: doctor.sub_specialty,
      department: doctor.department,
      hospital: doctor.hospital,
      room: doctor.room,
      available_today: isAvailableToday,
      available_now: isAvailableToday && targetDate.getHours() >= 9 && targetDate.getHours() < 18,
      consultation_type: doctor.consultation_type,
      available_slots: availableSlots,
      next_available_slot: matchingSlot || nextSlot,
      matches_requested_time: matchesRequestedTime,
      requested_time_query: requestedTime,
      queue_position: queueData.active_queue_count,
      estimated_wait_time: queueData.wait_time_display,
      queue_status: queueData.queue_status,
      appointment_status: isAvailableToday ? 'AVAILABLE' : 'OFF_DUTY_TODAY',
    };
  }

  /**
   * Helper to parse 24-hour equivalent from strings like "5 PM", "17:00", "5:00 PM", "11 AM"
   */
  parseHourFromText(text) {
    if (!text) return null;
    const clean = text.toLowerCase();

    // Match "5 pm", "5:00 pm", "5pm"
    const pmMatch = clean.match(/(\d{1,2})(?::\d{2})?\s*pm/);
    if (pmMatch) {
      let h = parseInt(pmMatch[1], 10);
      return h === 12 ? 12 : h + 12;
    }

    // Match "10 am", "09:30 am"
    const amMatch = clean.match(/(\d{1,2})(?::\d{2})?\s*am/);
    if (amMatch) {
      let h = parseInt(amMatch[1], 10);
      return h === 12 ? 0 : h;
    }

    // Match 24h "17:00"
    const h24Match = clean.match(/(\d{1,2}):\d{2}/);
    if (h24Match) {
      return parseInt(h24Match[1], 10);
    }

    return null;
  }

  /**
   * Rank and recommend doctors based on clinical specialty match, priority, and availability
   */
  async findAndRankDoctors(options = {}) {
    const {
      specialties = [],
      chiefComplaint = '',
      targetTime = null,
      priority = 'ROUTINE',
      consultationType = null,
      opdMode = null,
      opdSystem = null,
    } = options;

    let candidateDoctors = [];
    const dbDocs = await this.getDoctorsFromDB();

    // 1. AYUSH Discipline-Specific Matching
    const isAyush =
      opdMode === 'AYUSH' ||
      (consultationType && consultationType.startsWith('AYUSH')) ||
      (opdSystem && ['AYURVEDA', 'YOGA_NATUROPATHY', 'UNANI', 'SIDDHA', 'HOMOEOPATHY', 'SOWA_RIGPA'].includes(opdSystem.toUpperCase()));

    // Add matching DB doctors first
    const relevantDbDocs = dbDocs.filter((d) => (isAyush ? d.opd_type === 'AYUSH' : d.opd_type !== 'AYUSH'));
    relevantDbDocs.forEach((d) => candidateDoctors.push(d));

    if (isAyush) {
      const ayushSystem = (opdSystem || consultationType || '').toUpperCase();
      let matchedAyushDocs = [];

      if (ayushSystem.includes('YOGA') || ayushSystem.includes('NATUROPATHY')) {
        matchedAyushDocs = VERIFIED_DOCTORS_DIRECTORY.filter((d) => d.consultation_type === 'AYUSH_YOGA_NATUROPATHY' || d.specialty.includes('Yoga'));
      } else if (ayushSystem.includes('UNANI')) {
        matchedAyushDocs = VERIFIED_DOCTORS_DIRECTORY.filter((d) => d.consultation_type === 'AYUSH_UNANI' || d.specialty.includes('Unani'));
      } else if (ayushSystem.includes('SIDDHA')) {
        matchedAyushDocs = VERIFIED_DOCTORS_DIRECTORY.filter((d) => d.consultation_type === 'AYUSH_SIDDHA' || d.specialty.includes('Siddha'));
      } else if (ayushSystem.includes('HOMOEOPATHY') || ayushSystem.includes('HOMEOPATHY')) {
        matchedAyushDocs = VERIFIED_DOCTORS_DIRECTORY.filter((d) => d.consultation_type === 'AYUSH_HOMOEOPATHY' || d.specialty.includes('Homoeopathy'));
      } else if (ayushSystem.includes('SOWA') || ayushSystem.includes('RIGPA')) {
        matchedAyushDocs = VERIFIED_DOCTORS_DIRECTORY.filter((d) => d.consultation_type === 'AYUSH_SOWA_RIGPA' || d.specialty.includes('Sowa-Rigpa'));
      } else {
        // Default to Ayurveda
        matchedAyushDocs = VERIFIED_DOCTORS_DIRECTORY.filter((d) => d.consultation_type === 'AYUSH_AYURVEDA' || d.specialty.includes('Ayurveda'));
      }

      const ayushPool = matchedAyushDocs.length > 0 ? matchedAyushDocs : VERIFIED_DOCTORS_DIRECTORY.filter((d) => (d.consultation_type || '').startsWith('AYUSH'));
      ayushPool.forEach((doc) => {
        if (!candidateDoctors.some((d) => d.doctor_id === doc.doctor_id)) {
          candidateDoctors.push(doc);
        }
      });
    } else {
      // 2. Modern Medicine (General OPD) Specialty Matching
      if (specialties.length > 0) {
        for (const sp of specialties) {
          const matched = this.getDoctorsBySpecialty(sp).filter((d) => !(d.consultation_type || '').startsWith('AYUSH'));
          for (const doc of matched) {
            if (!candidateDoctors.some((d) => d.doctor_id === doc.doctor_id)) {
              candidateDoctors.push(doc);
            }
          }
        }
      }

      // Fallback: If no specialty candidates match, include General Medicine
      const genDocs = this.getDoctorsBySpecialty('General Medicine').filter((d) => !(d.consultation_type || '').startsWith('AYUSH'));
      genDocs.forEach((doc) => {
        if (!candidateDoctors.some((d) => d.doctor_id === doc.doctor_id)) {
          candidateDoctors.push(doc);
        }
      });
    }

    // 2. Compute availability for each candidate
    const evaluatedDoctors = await Promise.all(
      candidateDoctors.map((doc) =>
        this.calculateDoctorAvailability(doc, { targetTimeStr: targetTime })
      )
    );

    // 3. Rank doctors
    evaluatedDoctors.sort((a, b) => {
      // Priority factor: matches requested time slot
      if (a.matches_requested_time && !b.matches_requested_time) return -1;
      if (!a.matches_requested_time && b.matches_requested_time) return 1;

      // Availability factor: available today
      if (a.available_today && !b.available_today) return -1;
      if (!a.available_today && b.available_today) return 1;

      // Queue length factor: lower queue first
      return a.queue_position - b.queue_position;
    });

    return evaluatedDoctors;
  }

  /**
   * Find a doctor by name (e.g. "Dr. Nidhi Shah", "Nidhi Shah", "Arvind Joshi")
   */
  async findDoctorByName(nameQuery) {
    if (!nameQuery || typeof nameQuery !== 'string') return null;
    const clean = nameQuery.toLowerCase().replace(/^dr\.?\s*/i, '').trim();
    if (clean.length < 3) return null;

    const matchedDoc = VERIFIED_DOCTORS_DIRECTORY.find((d) => {
      const docClean = d.doctor_name.toLowerCase().replace(/^dr\.?\s*/i, '').trim();
      return docClean.includes(clean) || clean.includes(docClean);
    });

    if (!matchedDoc) return null;
    return this.calculateDoctorAvailability(matchedDoc);
  }

  /**
   * Convenience wrapper: get doctors matching a specialty with computed availability
   */
  async getDoctorsBySpecialtyWithAvailability(specialty, options = {}) {
    const rawDocs = this.getDoctorsBySpecialty(specialty);
    const docsToEval = rawDocs.length > 0 ? rawDocs : this.getDoctorsBySpecialty('General Medicine');
    const evaluated = await Promise.all(
      docsToEval.map((d) => this.calculateDoctorAvailability(d, { targetTimeStr: options.targetTime }))
    );

    evaluated.sort((a, b) => {
      if (a.matches_requested_time && !b.matches_requested_time) return -1;
      if (!a.matches_requested_time && b.matches_requested_time) return 1;
      if (a.available_today && !b.available_today) return -1;
      if (!a.available_today && b.available_today) return 1;
      return a.queue_position - b.queue_position;
    });

    return evaluated;
  }

  /**
   * Convenience wrapper: get all currently available doctors
   */
  async getAvailableDoctors(options = {}) {
    return this.findAndRankDoctors(options);
  }

  /**
   * Convenience wrapper: get doctor recommendation
   */
  async getDoctorRecommendation(options = {}) {
    return this.findAndRankDoctors(options);
  }
}

export const doctorService = new DoctorService();
export default doctorService;
