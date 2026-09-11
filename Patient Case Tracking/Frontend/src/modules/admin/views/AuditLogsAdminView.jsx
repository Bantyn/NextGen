import React, { useState, useEffect } from 'react';
import { ShieldAlert, Terminal } from 'lucide-react';
import AdminTable from '../components/AdminTable';
import AdminFilters from '../components/AdminFilters';
import adminApiService from '../services/adminApiService';

export const AuditLogsAdminView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async (query = search, pageNum = page) => {
    try {
      setLoading(true);
      const res = await adminApiService.getAuditLogs({ page: pageNum, limit: 20, search: query });
      setLogs(res.data || []);
      setTotalPages(res.meta?.total_pages || 1);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(search, 1);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const columns = [
    {
      header: 'Timestamp',
      key: 'createdAt',
      width: '160px',
      render: (row) => (
        <span className="font-mono text-[11px] text-slate-500">
          {new Date(row.createdAt || Date.now()).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Actor (User ID)',
      key: 'user_id',
      render: (row) => (
        <span className="font-mono font-semibold text-slate-800 text-[11px] bg-slate-100 px-2 py-0.5 rounded">
          {row.user_id || 'SYSTEM'}
        </span>
      ),
    },
    {
      header: 'Action Taken',
      key: 'action',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-sky-700">
          {row.action}
        </span>
      ),
    },
    {
      header: 'Resource',
      key: 'resource',
      render: (row) => (
        <div>
          <span className="text-slate-800 font-medium text-xs">{row.resource}</span>
          {row.resource_id && (
            <span className="block text-[10px] text-slate-400 font-mono">
              ID: {row.resource_id}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Audit Metadata Summary',
      key: 'details',
      render: (row) => (
        <div className="font-mono text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100 max-w-md truncate">
          {row.details ? JSON.stringify(row.details) : '—'}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Institutional Security & Audit Trail</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable forensic log of all administrative actions, triage escalations, and configuration changes.
        </p>
      </div>

      <AdminFilters
        search={search}
        onSearchChange={setSearch}
        placeholder="Filter logs by Action, User ID, or Resource..."
      />

      <AdminTable
        columns={columns}
        data={logs}
        loading={loading}
        emptyTitle="No Audit Logs Found"
        emptyDescription="Administrative operations will automatically stream into this ledger."
        pagination={{
          page,
          totalPages,
          total,
          onPageChange: (p) => {
            setPage(p);
            fetchLogs(search, p);
          },
        }}
      />
    </div>
  );
};

export default AuditLogsAdminView;
