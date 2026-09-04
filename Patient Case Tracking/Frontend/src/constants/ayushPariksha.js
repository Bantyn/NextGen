/**
 * AYUSH Dashavidha Pariksha & Ahara-Vihara Clinical Assessment Framework
 * Ministry of Ayush / CCRAS / AIIA Standard 10-Fold Examination Protocol.
 */
export const AYUSH_DASHAPARIKSHA_FRAMEWORK = {
  prakriti: {
    id: 'prakriti',
    title: '1. Prakriti (Constitution / प्रकृति)',
    options: [
      { id: 'vata_pitta', label: 'Vata-Pitta (વાત-પિત્ત)', desc: 'Light build, active, irregular digestion' },
      { id: 'pitta_kapha', label: 'Pitta-Kapha (પિત્ત-કફ)', desc: 'Medium build, strong appetite, warm' },
      { id: 'kapha_vata', label: 'Kapha-Vata (કફ-વાત)', desc: 'Sturdy build, calm, slow digestion' },
      { id: 'samadosha', label: 'Sama-Dosha (સમ-દોષ)', desc: 'Balanced tridosha constitution' }
    ]
  },
  vikriti: {
    id: 'vikriti',
    title: '2. Vikriti (Dosha Imbalance / વિકૃતિ)',
    options: [
      { id: 'vata_vriddhi', label: 'Vata Vriddhi (Joint pain, dryness, constipation)' },
      { id: 'pitta_vriddhi', label: 'Pitta Vriddhi (Hyperacidity, burning, inflammation)' },
      { id: 'kapha_vriddhi', label: 'Kapha Vriddhi (Congestion, heaviness, lethargy)' },
      { id: 'doshaja_sannipata', label: 'Sannipata (Multi-dosha combined)' }
    ]
  },
  sara: {
    id: 'sara',
    title: '3. Sara (Tissue Quality / સાર પરીક્ષા)',
    options: [
      { id: 'pravara', label: 'Pravara (Excellent / પ્રવર સાર)' },
      { id: 'madhyama', label: 'Madhyama (Moderate / મધ્યમ સાર)' },
      { id: 'avara', label: 'Avara (Sub-optimal / અવર સાર)' }
    ]
  },
  samhanana: {
    id: 'samhanana',
    title: '4. Samhanana (Body Compactness / સંહનન)',
    options: [
      { id: 'susamhata', label: 'Compact & Firm (સુસંહત)' },
      { id: 'madhyama', label: 'Moderate Compactness (મધ્યમ)' },
      { id: 'shithila', label: 'Loose / Flaccid (શિથિલ)' }
    ]
  },
  satmya: {
    id: 'satmya',
    title: '5. Satmya (Habituation & Adaptability / સાત્મ્ય)',
    options: [
      { id: 'sarva_rasa', label: 'All 6 Tastes Tolerated (સર્વરસ સાત્મ્ય)' },
      { id: 'madhyama', label: 'Moderate Adaptability (મધ્યમ)' },
      { id: 'eka_rasa', label: 'Sensitive to specific tastes/foods' }
    ]
  },
  ahara_shakti: {
    id: 'ahara_shakti',
    title: '6. Ahara Shakti (Digestive & Intake Capacity / આહાર શક્તિ)',
    options: [
      { id: 'tikshnagni', label: 'Tikshnagni (Very Rapid / તીક્ષ્ણ અગ્નિ)' },
      { id: 'samagni', label: 'Samagni (Normal & Healthy / સમ અગ્નિ)' },
      { id: 'mandagni', label: 'Mandagni (Sluggish & Bloated / મંદ અગ્નિ)' },
      { id: 'vishamagni', label: 'Vishamagni (Irregular / વિષમ અગ્નિ)' }
    ]
  },
  vyayama_shakti: {
    id: 'vyayama_shakti',
    title: '7. Vyayama Shakti (Physical Endurance / વ્યાયામ શક્તિ)',
    options: [
      { id: 'uttama', label: 'High Stamina (ઉત્તમ શક્તિ)' },
      { id: 'madhyama', label: 'Moderate Stamina (મધ્યમ શક્તિ)' },
      { id: 'avara', label: 'Low / Fatigues Quickly (અવર શક્તિ)' }
    ]
  },
  vaya: {
    id: 'vaya',
    title: '8. Vaya (Age Group / વય)',
    options: [
      { id: 'balya', label: 'Balya (< 16 Years / બાલ્ય)' },
      { id: 'madhyama', label: 'Madhyama (16 - 60 Years / યુવાન-પ્રૌઢ)' },
      { id: 'vriddha', label: 'Vriddha (> 60 Years / વૃદ્ધ)' }
    ]
  }
};

export default AYUSH_DASHAPARIKSHA_FRAMEWORK;
