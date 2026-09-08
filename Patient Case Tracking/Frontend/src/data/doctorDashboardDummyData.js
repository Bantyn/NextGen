/**
 * doctorDashboardDummyData.js
 * 
 * Centralized, realistic clinical dummy dataset for MediKiosk Doctor Dashboard.
 * Contains fictional patient records, structured clinical intake histories (SOCRATES),
 * OCR-extracted lab reports/diagnostics, and physician-friendly AI summaries.
 * 
 * ALL DATA IS SIMULATED AND FICTIONAL FOR DEMONSTRATION PURPOSES.
 */

export const initialDashboardStats = {
  totalOPD: 28,
  awaitingReview: 3,
  emergencyTriage: 1,
  completedToday: 24,
};

export const dummyPatients = [
  {
    id: "P001",
    sessionId: "DEMO_GUJARATI_001",
    token: "TK-101",
    patientName: "Ramesh Patel",
    age: 48,
    gender: "Male",
    phone: "+91 98765 43210",
    abhaId: "91-4432-8812-9901",
    language: "Gujarati (ગુજરાતી)",
    chiefComplaint: "Right knee joint pain with morning stiffness for 3 weeks",
    checkinTime: "10:15 AM",
    triageLevel: "NORMAL", // 'NORMAL' | 'MEDIUM' | 'RED_FLAG'
    triage: "standard",    // 'standard' | 'moderate' | 'red-flag' | 'approved'
    status: "PENDING_REVIEW", // 'PENDING_REVIEW' | 'IN_CONSULTATION' | 'APPROVED' | 'COMPLETED'
    consultationStatus: "pending",
    docsCount: 2,
    opdMode: "AYUSH / Ortho OPD",
    room: "Room 104",

    // Detailed structured clinical history (SOCRATES framework)
    history: {
      chiefComplaint: "Right knee joint pain with morning stiffness (~45 mins) lasting for 3 weeks.",
      hpi: {
        site: "Right knee joint (Medial compartment predominant)",
        onset: "Gradual onset over past 21 days, exacerbated when descending stairs or prolonged standing",
        character: "Dull aching pain with periodic cracking sensation (Crepitus)",
        radiation: "No radiation to thighs or ankle",
        associated: "Morning joint stiffness lasting 30-45 minutes, mild evening peri-articular puffiness",
        timing: "More severe during early morning and after evening walking",
        exacerbating: "Walking long distances, cold weather exposure",
        relieving: "Rest, hot water fomentation",
        severity: "6 / 10 on Numeric Pain Scale"
      },
      duration: "3 weeks",
      severity: "Moderate (6/10)",
      associatedSymptoms: "Morning stiffness, crepitus on knee flexion",
      pastMedicalHistory: "Known hypertensive since 2 years on Tab Telmisartan 40mg once daily. Non-diabetic.",
      pastSurgicalHistory: "No prior surgeries or joint interventions.",
      medicationHistory: "Tab Telmisartan 40mg (1-0-0), OTC Calcium supplements occasionally.",
      allergyHistory: "No known drug allergies (NKDA). No food allergies.",
      familyHistory: "Father had severe osteoarthritis of bilateral knees; Mother has hypertension.",
      personalHistory: "Non-smoker, non-alcoholic. Sedentary merchant business, irregular dinner timings."
    },

    // AYUSH Dashavidha Pariksha assessment
    ayushPariksha: {
      prakriti: "Vata-Pitta (વાત-પિત્ત પ્રધાન)",
      vikriti: "Vata Vriddhi (Sandhigata Vata)",
      sara: "Madhyama Sara (મધ્યમ સાર)",
      samhanana: "Susamhata (સુસંહત)",
      aharaShakti: "Vishamagni (વિષમ અગ્નિ / Irregular Digestion)",
      vyayamaShakti: "Madhyama (મધ્યમ વ્યાયામ શક્તિ)",
      suspectedDiagnosis: "Sandhigata Vata (Osteoarthritis of Right Knee)"
    },

    // Medical documents & extracted values
    documents: [
      {
        id: "DOC-001",
        name: "Blood_Routine_HbA1c.pdf",
        type: "Laboratory Report",
        date: "2026-09-02",
        status: "processed",
        fileSize: "1.4 MB",
        extractedData: {
          "Hemoglobin": "11.2 g/dL (Ref: 13.0 - 17.0)",
          "Blood Glucose (Fasting)": "128 mg/dL (Ref: 70 - 100)",
          "HbA1c": "6.8 % (Ref: < 5.7 %)",
          "Serum Uric Acid": "5.2 mg/dL (Ref: 3.5 - 7.2)",
          "ESR": "24 mm/hr (Ref: 0 - 15)"
        }
      },
      {
        id: "DOC-002",
        name: "Right_Knee_XRay_AP_LAT.pdf",
        type: "Radiology / Imaging",
        date: "2026-08-28",
        status: "processed",
        fileSize: "3.8 MB",
        extractedData: {
          "Joint Space": "Mild narrowing of medial tibiofemoral compartment",
          "Osteophytes": "Marginal osteophytes noted along tibial plateau",
          "Impression": "Features consistent with Kellgren-Lawrence Grade II Osteoarthritis"
        }
      }
    ],

    // AI Clinical Summary
    aiClinicalSummary: {
      chiefComplaint: "Right knee pain with morning stiffness for 3 weeks.",
      historyOfPresentIllness: "48-year-old male with gradual right medial knee joint ache, aggravated on stairs, associated with 45 minutes morning stiffness. Pain severity 6/10.",
      relevantMedicalHistory: "Essential hypertension (2 years, controlled on Telmisartan 40mg).",
      currentMedications: "Tab Telmisartan 40mg OD.",
      allergies: "NKDA (No Known Drug Allergies).",
      investigations: "X-Ray shows Grade II medial joint space reduction; Fasting glucose 128 mg/dL, Hb 11.2 g/dL.",
      redFlags: "None detected. Vitals stable.",
      aiNotes: "Symptom cluster and imaging strongly align with Sandhigata Vata (Knee OA). Recommend conservative AYUSH protocol with physical therapy and glycemic optimization.",
      verificationRequired: true
    },

    doctorRxNotes: "1. Yogaraj Guggulu 2 tabs twice daily after meals with lukewarm water.\n2. Janu Basti with Mahanarayana Taila for 7 consecutive days.\n3. Knee quadriceps isometric exercises and weight management counseling."
  },

  {
    id: "P002",
    sessionId: "DEMO_HINDI_002",
    token: "TK-102",
    patientName: "Sunita Sharma",
    age: 56,
    gender: "Female",
    phone: "+91 97654 32109",
    abhaId: "91-8891-2304-1144",
    language: "Hindi (हिंदी)",
    chiefComplaint: "Acute chest tightness, shortness of breath on climbing stairs",
    checkinTime: "10:22 AM",
    triageLevel: "RED_FLAG",
    triage: "red-flag",
    status: "PENDING_REVIEW",
    consultationStatus: "pending",
    docsCount: 1,
    opdMode: "Emergency / General Medicine",
    room: "Room 104",

    // Priority triage reasoning
    priorityAlertReason: "Acute chest tightness with shortness of breath on climbing stairs radiating towards left shoulder. AI detected a potential priority concern.",

    // Detailed structured clinical history
    history: {
      chiefComplaint: "Substernal chest tightness with dyspnea on mild exertion for 4 days.",
      hpi: {
        site: "Retrosternal chest region with dull radiation toward left upper arm",
        onset: "Acute onset 4 days ago, significantly aggravated after climbing one flight of stairs",
        character: "Heavy squeezing tightness / pressure sensation",
        radiation: "Left shoulder and medial aspect of left arm",
        associated: "Cold diaphoresis, shortness of breath (NYHA Class II-III), palpitations",
        timing: "Episodes last 10-15 minutes, triggered by exertion",
        exacerbating: "Physical activity, heavy meals, cold air",
        relieving: "Partial relief upon complete sitting rest after 10 minutes",
        severity: "8 / 10 during peak episode"
      },
      duration: "4 days",
      severity: "Severe / Priority (8/10)",
      associatedSymptoms: "Cold sweating, dyspnea, left arm discomfort",
      pastMedicalHistory: "Type 2 Diabetes Mellitus for 6 years on Metformin 500mg BD. Dyslipidemia for 3 years.",
      pastSurgicalHistory: "No prior surgical interventions.",
      medicationHistory: "Tab Metformin 500mg BD, Tab Atorvastatin 20mg HS.",
      allergyHistory: "Known mild allergy to Penicillin (cutaneous rash).",
      familyHistory: "Strong family history of Coronary Artery Disease; brother had myocardial infarction at age 52.",
      personalHistory: "Non-smoker, homemaker with high stress levels. Post-menopausal."
    },

    ayushPariksha: {
      prakriti: "Pitta-Kapha (પિત્ત-કફ પ્રધાન)",
      vikriti: "Hridroga Purvaroopa / Pittavrita Vata",
      sara: "Avara Sara",
      samhanana: "Madhyama",
      aharaShakti: "Mandagni",
      vyayamaShakti: "Avara (Low exercise tolerance)",
      suspectedDiagnosis: "Suspected Acute Coronary Syndrome (ACS) / Angina Pectoris — Requires Immediate ECG & Cardiology Referral"
    },

    documents: [
      {
        id: "DOC-003",
        name: "ECG_Screening_Strip.pdf",
        type: "Diagnostic Strip / Cardiology",
        date: "2026-09-08",
        status: "processed",
        fileSize: "840 KB",
        extractedData: {
          "Heart Rate": "98 bpm (Sinus rhythm)",
          "ST Segment": "Subtle 1mm ST depression noted in leads V4-V6",
          "T Wave": "T-wave inversion in lead aVL",
          "Recommendation": "Immediate 12-lead standard hospital ECG and Serial Troponin-I"
        }
      }
    ],

    aiClinicalSummary: {
      chiefComplaint: "Acute chest tightness and exertional dyspnea radiating to left arm for 4 days.",
      historyOfPresentIllness: "56-year-old female diabetic presenting with progressive retrosternal heaviness and diaphoresis on mild stair climbing.",
      relevantMedicalHistory: "Type 2 Diabetes Mellitus (6 yrs), Dyslipidemia (3 yrs), Family history of premature CAD.",
      currentMedications: "Metformin 500mg BD, Atorvastatin 20mg HS.",
      allergies: "Penicillin (rash).",
      investigations: "Triage ECG reveals lateral lead ST depression. Troponin-I stat ordered.",
      redFlags: "HIGH PRIORITY: Retrosternal ischemic chest discomfort with radiation and diaphoresis.",
      aiNotes: "CRITICAL: Potential non-ST elevation acute coronary syndrome (NSTE-ACS). AI detected a potential priority concern. Immediate attending physician review required.",
      verificationRequired: true
    },

    doctorRxNotes: "1. STAT 12-lead ECG and Troponin-I quantitative test.\n2. Sublingual Sorbitrate 5mg if systolic BP > 100 mmHg.\n3. Immediate cardiology consultation and transfer to emergency cardiac monitoring bed."
  },

  {
    id: "P003",
    sessionId: "DEMO_ENG_003",
    token: "TK-103",
    patientName: "Anand Verma",
    age: 34,
    gender: "Male",
    phone: "+91 96543 21098",
    abhaId: "91-3312-7721-8833",
    language: "English",
    chiefComplaint: "Chronic acidity, disturbed sleep, post-meal bloating",
    checkinTime: "09:50 AM",
    triageLevel: "NORMAL",
    triage: "approved",
    status: "APPROVED",
    consultationStatus: "approved",
    docsCount: 0,
    opdMode: "Gastroenterology / Lifestyle OPD",
    room: "Room 104",

    history: {
      chiefComplaint: "Frequent epigastric burning sensation, sour eructations, and sleep disturbances for 2 months.",
      hpi: {
        site: "Epigastrium and retrosternal lower esophageal area",
        onset: "Insidious onset over 8 weeks, worsening over past fortnight",
        character: "Burning acid regurgitation sensation (Amlapitta)",
        radiation: "Upward toward throat, especially when reclining after dinner",
        associated: "Post-prandial abdominal fullness, disturbed REM sleep, bitter taste in mouth",
        timing: "Occurs 1-2 hours after meals and at bedtime around 11:30 PM",
        exacerbating: "Late-night spicy meals, coffee (>3 cups/day), stress",
        relieving: "Cold milk, OTC antacids provide temporary 1-hour relief",
        severity: "4 / 10"
      },
      duration: "2 months",
      severity: "Mild to Moderate (4/10)",
      associatedSymptoms: "Post-meal bloating, sour belching, morning nausea",
      pastMedicalHistory: "No chronic systemic illness. No previous history of peptic ulcer bleed.",
      pastSurgicalHistory: "None.",
      medicationHistory: "Occasional OTC Pantoprazole 40mg and antacid gel.",
      allergyHistory: "No known allergies.",
      familyHistory: "No history of GI malignancies.",
      personalHistory: "IT professional, sedentary 10-hour screen time, irregular meal schedule."
    },

    ayushPariksha: {
      prakriti: "Pitta-Vata",
      vikriti: "Pitta Prakopa (Urdhvaga Amlapitta)",
      sara: "Madhyama",
      samhanana: "Madhyama",
      aharaShakti: "Tikshnagni with Vidaha",
      vyayamaShakti: "Madhyama",
      suspectedDiagnosis: "Urdhvaga Amlapitta (Non-Erosive GERD / Functional Dyspepsia)"
    },

    documents: [],

    aiClinicalSummary: {
      chiefComplaint: "Chronic heartburn, water brash, and post-prandial fullness for 8 weeks.",
      historyOfPresentIllness: "34-year-old software engineer experiencing bedtime regurgitation and disrupted sleep linked to erratic work hours and excessive caffeine.",
      relevantMedicalHistory: "Unremarkable past medical history.",
      currentMedications: "OTC PPIs on demand.",
      allergies: "NKDA.",
      investigations: "None pending. No alarm symptoms (no dysphagia, weight loss, or anemia).",
      redFlags: "None. Vitals normal.",
      aiNotes: "Clinical pattern typical of Urdhvaga Amlapitta. Primary indication for dietary correction (Pathya-Apathya) and mild herbal antacid formulations.",
      verificationRequired: true
    },

    doctorRxNotes: "1. Sutshekhar Ras 1 tab twice daily before food.\n2. Avipattikar Churna 3g at bedtime with warm water.\n3. Strict cessation of caffeine after 4 PM; dinner at least 2.5 hours before sleeping."
  },

  {
    id: "P004",
    sessionId: "DEMO_MARATHI_004",
    token: "TK-104",
    patientName: "Pooja Kulkarni",
    age: 41,
    gender: "Female",
    phone: "+91 95432 10987",
    abhaId: "91-7723-9901-4455",
    language: "Marathi (मराठी)",
    chiefComplaint: "Migraine episodes with nausea, photosensitivity",
    checkinTime: "10:35 AM",
    triageLevel: "MEDIUM",
    triage: "moderate",
    status: "PENDING_REVIEW",
    consultationStatus: "pending",
    docsCount: 1,
    opdMode: "Neurology / AYUSH Shalakya",
    room: "Room 104",

    history: {
      chiefComplaint: "Unilateral pulsating headache on left temple with nausea and bright-light sensitivity for 6 months.",
      hpi: {
        site: "Left fronto-temporal region",
        onset: "Paroxysmal attacks occurring 2-3 times per month, each lasting 12 to 24 hours",
        character: "Throbbing, pulsating severe headache (Ardhavabhedaka)",
        radiation: "Radiating to left eye socket and neck",
        associated: "Visual aura (flashing zig-zag lights 20 mins prior), nausea, phonophobia",
        timing: "Usually triggered on waking up or after skipping breakfast",
        exacerbating: "Direct sunlight, loud noises, mental fatigue, skipping meals",
        relieving: "Dark quiet room rest, cold compress over temple, sleep",
        severity: "7 / 10 during acute attack"
      },
      duration: "6 months",
      severity: "Moderate to High (7/10)",
      associatedSymptoms: "Nausea, photophobia, sensory hypersensitivity",
      pastMedicalHistory: "Hypothyroidism diagnosed 4 years ago on Tab Levothyroxine 50mcg.",
      pastSurgicalHistory: "None.",
      medicationHistory: "Tab Levothyroxine 50mcg empty stomach; Tab Naproxen 500mg for headache crisis.",
      allergyHistory: "Sulfonamide allergy (dermatitis).",
      familyHistory: "Maternal aunt had chronic migraine.",
      personalHistory: "School teacher, irregular hydration during school hours, moderate emotional stress."
    },

    ayushPariksha: {
      prakriti: "Vata-Pitta",
      vikriti: "Ardhavabhedaka (Tridoshaja with Vata-Pitta predominance)",
      sara: "Madhyama",
      samhanana: "Susamhata",
      aharaShakti: "Vishamagni",
      vyayamaShakti: "Madhyama",
      suspectedDiagnosis: "Ardhavabhedaka (Migraine without Aura / Episodic Hemicrania)"
    },

    documents: [
      {
        id: "DOC-004",
        name: "Brain_MRI_Screening.pdf",
        type: "Neuro-Radiology",
        date: "2026-07-15",
        status: "processed",
        fileSize: "2.1 MB",
        extractedData: {
          "Brain Parenchyma": "Normal signal intensity; no space-occupying lesion or acute hemorrhage",
          "Ventricular System": "Normal size, symmetrical ventricles",
          "Vascular Structures": "Major intracranial flow voids preserved",
          "Conclusion": "Normal brain MRI study. No secondary structural pathology identified."
        }
      }
    ],

    aiClinicalSummary: {
      chiefComplaint: "Episodic left hemicranial throbbing headaches with photophobia and nausea.",
      historyOfPresentIllness: "41-year-old female presenting with classical migraine phenotype, 2-3 disabling episodes per month.",
      relevantMedicalHistory: "Hypothyroidism (Euthyroid on Levothyroxine 50mcg).",
      currentMedications: "Levothyroxine 50mcg OD.",
      allergies: "Sulfa drugs.",
      investigations: "Brain MRI unremarkable, ruling out secondary intracranial hypertension.",
      redFlags: "No neurological focal deficit, no papilledema.",
      aiNotes: "Migraine with aura / Ardhavabhedaka. Recommended Nasya therapy protocol and migraine preventive therapy.",
      verificationRequired: true
    },

    doctorRxNotes: "1. Anu Taila Nasya 2 drops in each nostril daily morning on empty stomach.\n2. Pathyadi Kadha 15ml with equal warm water after meals twice daily.\n3. Maintain headache trigger diary and ensure adequate hydration."
  },

  {
    id: "P005",
    sessionId: "DEMO_COMPLETED_005",
    token: "TK-099",
    patientName: "Rajesh Gupta",
    age: 62,
    gender: "Male",
    phone: "+91 94321 09876",
    abhaId: "91-1199-4455-6677",
    language: "Hindi (हिंदी)",
    chiefComplaint: "Routine hypertension and diabetes 3-month follow-up visit",
    checkinTime: "09:15 AM",
    triageLevel: "NORMAL",
    triage: "completed",
    status: "COMPLETED",
    consultationStatus: "completed",
    docsCount: 2,
    opdMode: "Chronic Disease Management",
    room: "Room 104",

    history: {
      chiefComplaint: "Follow-up visit for hypertension and glycaemic review; currently asymptomatic.",
      hpi: {
        site: "Systemic evaluation",
        onset: "Known chronic conditions for 8+ years",
        character: "Asymptomatic; routine monitoring",
        radiation: "None",
        associated: "No dizziness, chest pain, palpitations, or pedal edema",
        timing: "Consistent over last quarter",
        exacerbating: "None",
        relieving: "Regular medications, morning walks",
        severity: "1 / 10"
      },
      duration: "Chronic (8 years)",
      severity: "Controlled (1/10)",
      associatedSymptoms: "None reported",
      pastMedicalHistory: "Hypertension (8 yrs), Type 2 Diabetes (6 yrs).",
      pastSurgicalHistory: "Appendectomy in 1998.",
      medicationHistory: "Tab Amlodipine 5mg OD, Tab Metformin 500mg BD.",
      allergyHistory: "NKDA.",
      familyHistory: "Both parents were hypertensive.",
      personalHistory: "Retired bank officer, walks 45 minutes daily, vegetarian diet."
    },

    ayushPariksha: {
      prakriti: "Kapha-Vata",
      vikriti: "Rasavaha Srotas Dushti",
      sara: "Pravara",
      samhanana: "Susamhata",
      aharaShakti: "Samagni",
      vyayamaShakti: "Pravara",
      suspectedDiagnosis: "Essential Hypertension & T2DM — Stable on current therapy"
    },

    documents: [
      {
        id: "DOC-005",
        name: "Quarterly_Lipid_Kidney_Panel.pdf",
        type: "Comprehensive Lab Panel",
        date: "2026-09-06",
        status: "processed",
        fileSize: "1.7 MB",
        extractedData: {
          "Blood Pressure (Clinic)": "126/82 mmHg",
          "HbA1c": "6.4 % (Good control)",
          "Serum Creatinine": "0.9 mg/dL (Normal)",
          "eGFR": "> 90 mL/min/1.73m²",
          "Lipid Profile": "Total Chol: 172 mg/dL, Triglycerides: 140 mg/dL, HDL: 46 mg/dL"
        }
      }
    ],

    aiClinicalSummary: {
      chiefComplaint: "Quarterly surveillance of hypertension and diabetes.",
      historyOfPresentIllness: "62-year-old male with well-controlled parameters, compliance confirmed.",
      relevantMedicalHistory: "HTN & T2DM for 8 years.",
      currentMedications: "Amlodipine 5mg OD, Metformin 500mg BD.",
      allergies: "NKDA.",
      investigations: "HbA1c 6.4%, normal renal and lipid parameters.",
      redFlags: "None.",
      aiNotes: "Exemplary disease management. Continue existing dosage and schedule next follow-up in 3 months.",
      verificationRequired: false
    },

    doctorRxNotes: "Continue Tab Amlodipine 5mg and Tab Metformin 500mg BD. Re-check BP and blood sugar in December 2026."
  }
];
