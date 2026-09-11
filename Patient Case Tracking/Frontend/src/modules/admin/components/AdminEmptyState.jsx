import React from 'react';
import { Inbox } from 'lucide-react';

export const AdminEmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no records matching your current filter criteria or dataset is empty.',
  action,
}) => {
  return (
    <div className="py-14 px-6 text-center flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-2xl">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm font-normal">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default AdminEmptyState;
