import React from 'react';
import { RefreshCw, Inbox } from 'lucide-react';
import { PatientQueueRow } from './PatientQueueRow';

/**
 * OPDQueueTable Component
 * Displays the Live OPD Queue table with columns, headers, and refresh functionality.
 */
export const OPDQueueTable = ({
  patients = [],
  isLoading = false,
  onRefresh,
  onExamine,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      {/* Table Title Bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-medium text-slate-900">Live OPD Queue</h2>
          <p className="text-xs text-slate-400 font-normal">
            Showing patients waiting for consultation in Room 104
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-3.5 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3 h-3 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Table Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-normal text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] text-slate-400 font-medium">
            <tr>
              <th scope="col" className="px-6 py-3.5">Token</th>
              <th scope="col" className="px-6 py-3.5">Patient Details</th>
              <th scope="col" className="px-6 py-3.5">Language</th>
              <th scope="col" className="px-6 py-3.5">AI Chief Complaint</th>
              <th scope="col" className="px-6 py-3.5">Reports</th>
              <th scope="col" className="px-6 py-3.5">Triage</th>
              <th scope="col" className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.length > 0 ? (
              patients.map((patient) => (
                <PatientQueueRow
                  key={patient.sessionId || patient.id}
                  patient={patient}
                  onExamine={onExamine}
                />
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-slate-300 stroke-1" />
                    <p className="text-xs font-medium text-slate-600">No patients found</p>
                    <p className="text-[11px] text-slate-400">
                      Try selecting another filter or clearing your search query.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OPDQueueTable;
