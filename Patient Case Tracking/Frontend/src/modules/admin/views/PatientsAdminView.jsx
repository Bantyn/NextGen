import React, { useState, useEffect } from 'react';
import { User, Phone, Calendar, ShieldCheck } from 'lucide-react';
import AdminTable from '../components/AdminTable';
import AdminFilters from '../components/AdminFilters';
import AdminStatusBadge from '../components/AdminStatusBadge';
import AdminModal from '../components/AdminModal';
import adminApiService from '../services/adminApiService';

export const PatientsAdminView = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchPatients = async (query = search, pageNum = page) => {
    try {
      setLoading(true);
      const res = await adminApiService.getPatients({ page: pageNum, limit: 15, search: query });
      setPatients(res.data || []);
      setTotalPages(res.meta?.total_pages || 1);
      setTotal(res.meta?.total || (res.data ? res.data.length : 0));
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(search, 1);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchPatients(search, newPage);
  };

  const columns = [
    {
      header: 'Patient ID',
      key: 'patient_id',
      render: (row) => (
        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
          {row.patient_id}
        </span>
      ),
    },
    {
      header: 'Name',
      key: 'name',
      render: (row) => (
        <div className="font-medium text-slate-800">
          {row.first_name} {row.last_name}
        </div>
      ),
    },
    {
      header: 'Demographics',
      key: 'demographics',
      render: (row) => (
        <span className="text-slate-600 text-xs">
          {row.gender || 'OTHER'}
        </span>
      ),
    },
    {
      header: 'Phone Contact',
      key: 'phone',
      render: (row) => (
        <span className="text-slate-600 font-mono text-xs">{row.phone}</span>
      ),
    },
    {
      header: 'Status',
      key: 'current_status',
      render: (row) => <AdminStatusBadge status={row.current_status || 'CHECKED_IN'} size="xs" />,
    },
    {
      header: 'Registered',
      key: 'createdAt',
      render: (row) => (
        <span className="text-slate-500 text-[11px]">
          {new Date(row.createdAt || Date.now()).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <button
          onClick={() => setSelectedPatient(row)}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
        >
          View Profile
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Patient Directory</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Centralized patient master index with demographics, ABHA identifiers, and check-in timeline.
        </p>
      </div>

      <AdminFilters
        search={search}
        onSearchChange={setSearch}
        placeholder="Search patients by name, phone, or Patient ID..."
      />

      <AdminTable
        columns={columns}
        data={patients}
        loading={loading}
        emptyTitle="No Patients Found"
        emptyDescription="Try modifying your search criteria."
        pagination={{
          page,
          totalPages,
          total,
          onPageChange: handlePageChange,
        }}
      />

      {/* Patient Profile Modal */}
      <AdminModal
        isOpen={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
        title={`Patient Record: ${selectedPatient?.first_name} ${selectedPatient?.last_name}`}
        description={`Identifier: ${selectedPatient?.patient_id}`}
        footer={
          <button
            onClick={() => setSelectedPatient(null)}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
          >
            Close Record
          </button>
        }
      >
        {selectedPatient && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Patient ID</span>
                <span className="font-mono font-bold text-slate-900">{selectedPatient.patient_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                <span className="font-mono text-slate-800">{selectedPatient.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Gender</span>
                <span className="font-medium text-slate-800">{selectedPatient.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current State</span>
                <AdminStatusBadge status={selectedPatient.current_status || 'CHECKED_IN'} size="xs" />
              </div>
            </div>

            <div className="p-3 bg-sky-50 text-sky-900 rounded-xl border border-sky-200/60 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>ABDM Health ID Consent: Verified under institutional compliance framework.</span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-800 mb-2">Emergency Contact</h4>
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                {selectedPatient.emergency_contact?.name ? (
                  <div>
                    <strong>{selectedPatient.emergency_contact.name}</strong> ({selectedPatient.emergency_contact.relationship || 'Contact'}): {selectedPatient.emergency_contact.phone}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">No emergency contact registered.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
};

export default PatientsAdminView;
