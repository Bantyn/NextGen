import mongoose from 'mongoose';
import { connectDB } from '../utils/db.js';
import { doctorPanelService } from '../services/doctorPanelService.js';
import { PrescriptionTemplate } from '../models/PrescriptionTemplate.js';
import { User } from '../models/User.js';

async function runDoctorPanelTests() {
  console.log('========================================================================');
  console.log('🩺 SEHAT BACKEND — DOCTOR PANEL SERVICE INTEGRATION TEST SUITE');
  console.log('========================================================================\n');

  await connectDB();

  try {
    const testDoctorId = 'DOC-MED-01';

    // 1. Test Dashboard Stats
    console.log('--- 1. Testing Doctor Dashboard Stats ---');
    const stats = await doctorPanelService.getDoctorDashboardStats(testDoctorId);
    console.log('   Stats retrieved:', JSON.stringify(stats));
    if (typeof stats.totalOPD !== 'number' || typeof stats.awaitingReview !== 'number') {
      throw new Error('Invalid dashboard stats format');
    }
    console.log('✅ PASSED: Dashboard statistics aggregated successfully\n');

    // 2. Test OPD Queue
    console.log('--- 2. Testing Doctor Live OPD Queue ---');
    const queue = await doctorPanelService.getDoctorOPDQueue(testDoctorId, { tab: 'ALL' });
    console.log('   Queue items count:', queue.length);
    console.log('✅ PASSED: Live OPD queue fetched successfully\n');

    // 3. Test Prescription Templates (Seeding & Query)
    console.log('--- 3. Testing Prescription Templates ---');
    const templates = await doctorPanelService.getPrescriptionTemplates(testDoctorId);
    console.log('   Templates loaded count:', templates.length);
    if (templates.length === 0) {
      throw new Error('Default prescription templates were not seeded.');
    }
    console.log('   Sample template title:', templates[0].title, '| Meds count:', templates[0].medicines.length);
    console.log('✅ PASSED: Prescription templates loaded and seeded successfully\n');

    // 4. Test Save New Template
    console.log('--- 4. Testing Custom Template Creation ---');
    const customTpl = await doctorPanelService.savePrescriptionTemplate(testDoctorId, {
      template_id: `TPL-TEST-${Date.now()}`,
      title: 'Seasonal Allergy & Rhinitis Protocol',
      category: 'ENT & Allergy',
      notes: 'Avoid cold exposure and pollen dust.',
      medicines: [
        {
          medicine_name: 'Levocetirizine 5mg',
          dosage: '1 tab',
          frequency: 'Once daily at night (OD)',
          duration: '7 days',
          before_after_food: 'AFTER_FOOD',
        },
      ],
    });
    console.log('   Created custom template:', customTpl.template_id, '| Title:', customTpl.title);
    console.log('✅ PASSED: Custom prescription template created\n');

    // 5. Test Delete Custom Template
    console.log('--- 5. Testing Template Deletion ---');
    await doctorPanelService.deletePrescriptionTemplate(testDoctorId, customTpl.template_id);
    console.log('✅ PASSED: Template deleted successfully\n');

    // 6. Test Doctor Availability Toggle
    console.log('--- 6. Testing Availability & On-Duty Toggle ---');
    const availResult = await doctorPanelService.updateDoctorAvailability(testDoctorId, {
      on_duty: true,
      availability_status: 'AVAILABLE',
    });
    console.log('   Availability state:', availResult.availability_status, '| On duty:', availResult.on_duty);
    console.log('✅ PASSED: Doctor availability updated successfully\n');

    // 7. Test Clinical Analytics
    console.log('--- 7. Testing Clinical Analytics Telemetry ---');
    const analytics = await doctorPanelService.getDoctorAnalytics(testDoctorId);
    console.log('   Analytics:', JSON.stringify(analytics));
    if (!analytics.doctor_id || typeof analytics.patients_handled_today !== 'number') {
      throw new Error('Invalid analytics response');
    }
    console.log('✅ PASSED: Doctor clinical analytics aggregated successfully\n');

    // 8. Test Eligible Colleagues for Handoff
    console.log('[Test 8/8] Testing Specialist Roster for Transfer Handoff...');
    const colleagues = await doctorPanelService.getEligibleColleagues('DOC-MED-01');
    console.log(`Available Colleagues: ${colleagues.length}`);
    if (!Array.isArray(colleagues) || colleagues.length === 0) {
      throw new Error('No eligible colleagues returned');
    }
    console.log('✅ PASSED: Specialist colleagues roster retrieved successfully\n');

    console.log('========================================================================');
    console.log('🎉 ALL DOCTOR PANEL BACKEND TESTS PASSED SUCCESSFULLY!');
    console.log('========================================================================');
  } finally {
    await mongoose.disconnect();
  }
}

runDoctorPanelTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
